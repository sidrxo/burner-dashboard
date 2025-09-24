import { useEffect, useMemo, useState } from "react";
import {
  collection, getDocs, orderBy, query, setDoc, doc, updateDoc, deleteDoc,
  Timestamp, writeBatch, where, getDoc
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "@/components/useAuth";
import { toast } from "sonner";

export type Event = { id: string } & any;

export type Venue = {
  id: string;
  name: string;
};

export type EventFormData = {
  id: string;
  name: string;
  description: string;
  venue: string;
  venueId: string;
  datetime: string;
  price: number;
  maxTickets: number;
  isFeatured: boolean;
};

export function useEventsData() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Load events with venue filtering
  useEffect(() => {
    if (!authLoading && user) {
      loadEvents();
      if (user.role === "siteAdmin") {
        loadVenues();
      }
    }
  }, [user, authLoading]);

  const loadVenues = async () => {
    try {
      const snapshot = await getDocs(collection(db, "venues"));
      const loadedVenues: Venue[] = [];
      snapshot.forEach((doc) => {
        loadedVenues.push({
          id: doc.id,
          name: doc.data().name,
        });
      });
      setVenues(loadedVenues);
    } catch (e: any) {
      console.error("Error loading venues:", e);
      toast.error("Failed to load venues");
    }
  };

  const loadEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let eventsQuery;
      
      if (user.role === "siteAdmin") {
        // Site admins see all events
        eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"));
      } else if (user.role === "venueAdmin" || user.role === "subAdmin") {
        // Venue admins and sub-admins only see events for their venue
        if (!user.venueId) {
          toast.error("No venue assigned to your account");
          setEvents([]);
          setLoading(false);
          return;
        }
        eventsQuery = query(
          collection(db, "events"),
          where("venueId", "==", user.venueId),
          orderBy("createdAt", "desc")
        );
      } else {
        setEvents([]);
        setLoading(false);
        return;
      }

      const snap = await getDocs(eventsQuery);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Event[];
      list.sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
      setEvents(list);
    } catch (e: any) {
      console.error("Error loading events:", e);
      toast.error("Failed to load events: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return events;
    return events.filter(e =>
      (e.name?.toLowerCase().includes(s)) ||
      (e.venue?.toLowerCase().includes(s)) ||
      (e.description?.toLowerCase().includes(s))
    );
  }, [events, search]);

  // Only allow site admins to toggle featured status
  const onToggleFeatured = async (ev: Event) => {
    // Check if user exists and is site admin
    if (!user || user.role !== "siteAdmin") {
      toast.error("Only site administrators can manage featured events");
      return;
    }

    try {
      await updateDoc(doc(db, "events", ev.id), { isFeatured: !ev.isFeatured, updatedAt: Timestamp.now() });
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, isFeatured: !e.isFeatured } : e));
      toast.success(`Event ${!ev.isFeatured ? "featured" : "unfeatured"}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle feature");
    }
  };

  const onDelete = async (ev: Event) => {
    try {
      const ticketsSnap = await getDocs(collection(db, "events", ev.id, "tickets"));
      if (!ticketsSnap.empty) {
        const batch = writeBatch(db);
        ticketsSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      if (ev.imageUrl) {
        try { await deleteObject(ref(storage, ev.imageUrl)); } catch {}
      }
      await deleteDoc(doc(db, "events", ev.id));
      setEvents(prev => prev.filter(e => e.id !== ev.id));
      toast.success("Event deleted successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete event");
    }
  };

  const getEventStatus = (ev: Event) => {
    const now = new Date();
    const eventDate = new Date(ev.date?.seconds * 1000);
    const isSoldOut = ev.ticketsSold >= ev.maxTickets;
    const isPast = eventDate < now;
    
    if (isPast) return { status: "past", label: "Past Event", variant: "secondary" as const };
    if (isSoldOut) return { status: "soldout", label: "Sold Out", variant: "destructive" as const };
    return { status: "available", label: "Available", variant: "default" as const };
  };

  const getTicketProgress = (ev: Event) => {
    const sold = ev.ticketsSold || 0;
    const max = ev.maxTickets || 1;
    return Math.min((sold / max) * 100, 100);
  };

  return {
    user,
    authLoading,
    events,
    venues,
    loading,
    search,
    setSearch,
    filtered,
    onToggleFeatured,
    onDelete,
    getEventStatus,
    getTicketProgress,
    loadEvents,
    setEvents
  };
}

// Event Form Logic
export function useEventForm(
  existing: Event | null,
  user: any,
  venues: Venue[],
  onSaved: (e: Event) => void,
  onClose: () => void
) {
  const isEdit = !!existing;
  const [form, setForm] = useState<EventFormData>({
    id: existing?.id ?? "",
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    venue: existing?.venue ?? "",
    venueId: existing?.venueId ?? (user.role === "siteAdmin" ? "" : user.venueId || ""),
    datetime: existing?.date ? new Date(existing.date.seconds * 1000).toISOString().slice(0,16) : "",
    price: existing?.price ?? 0,
    maxTickets: existing?.maxTickets ?? 0,
    isFeatured: user.role === "siteAdmin" ? !!existing?.isFeatured : false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  async function uploadImageIfAny(eventId: string) {
    if (!file) return existing?.imageUrl ?? null;
    const allowed = ["image/jpeg","image/jpg","image/png","image/gif"];
    if (!allowed.includes(file.type)) throw new Error("Invalid file type");
    if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)");

    const storagePath = `event-images/${eventId}/${Date.now()}_${file.name}`;
    const r = ref(storage, storagePath);
    const task = uploadBytesResumable(r, file);
    const url: string = await new Promise((resolve, reject) => {
      task.on("state_changed",
        (snap) => setProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });

    if (existing?.imageUrl && existing.imageUrl !== url) {
      try { await deleteObject(ref(storage, existing.imageUrl)); } catch {}
    }
    return url;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      if (!form.name || !form.datetime) throw new Error("Please fill all required fields");

      // Determine venue info
      let selectedVenueId = "";
      let selectedVenueName = "";

      if (user.role === "siteAdmin") {
        if (!form.venueId) {
          throw new Error("Please select a venue");
        }
        selectedVenueId = form.venueId;
        const selectedVenue = venues.find(v => v.id === form.venueId);
        selectedVenueName = selectedVenue?.name || "Unknown Venue";
      } else {
        // Venue admin or sub-admin
        if (!user.venueId) {
          throw new Error("No venue assigned to your account");
        }
        selectedVenueId = user.venueId;
        
        // Get venue name
        try {
          const venueDoc = await getDoc(doc(db, "venues", user.venueId));
          selectedVenueName = venueDoc.exists() ? venueDoc.data().name : "Unknown Venue";
        } catch (e) {
          selectedVenueName = "Unknown Venue";
        }
      }

      const date = Timestamp.fromDate(new Date(form.datetime));

      if (isEdit) {
        const url = await uploadImageIfAny(existing!.id);

        const updated: Event = {
          id: existing!.id,
          name: form.name,
          description: form.description,
          venue: selectedVenueName,
          venueId: selectedVenueId,
          datetime: form.datetime,
          price: Number(form.price),
          maxTickets: Number(form.maxTickets),
          isFeatured: user.role === "siteAdmin" ? form.isFeatured : (existing?.isFeatured ?? false),
          date,
          imageUrl: url ?? existing?.imageUrl ?? null,
          ticketsSold: existing!.ticketsSold ?? 0,
        };

        const updateData: any = {
          name: updated.name,
          venue: updated.venue,
          venueId: updated.venueId,
          date: updated.date,
          price: updated.price,
          maxTickets: updated.maxTickets,
          description: updated.description || null,
          ticketsSold: updated.ticketsSold,
          ...(url ? { imageUrl: url } : {}),
          updatedAt: Timestamp.now(),
        };

        if (user.role === "siteAdmin") {
          updateData.isFeatured = updated.isFeatured;
        }

        await updateDoc(doc(db, "events", existing!.id), updateData);

        onSaved(updated);
        toast.success("Event updated successfully");
      } else {
        if (!form.id.trim()) throw new Error("Event ID is required");
        const url = await uploadImageIfAny(form.id);

        const created: Event = {
          id: form.id,
          name: form.name,
          description: form.description,
          venue: selectedVenueName,
          venueId: selectedVenueId,
          datetime: form.datetime,
          price: Number(form.price),
          maxTickets: Number(form.maxTickets),
          isFeatured: user.role === "siteAdmin" ? form.isFeatured : false,
          date,
          imageUrl: url ?? null,
          ticketsSold: 0,
        };

        await setDoc(doc(db, "events", form.id), {
          name: created.name,
          venue: created.venue,
          venueId: created.venueId,
          date: created.date,
          price: created.price,
          maxTickets: created.maxTickets,
          isFeatured: created.isFeatured,
          description: created.description || null,
          imageUrl: created.imageUrl,
          ticketsSold: 0,
          createdAt: Timestamp.now(),
          createdBy: user.uid,
        });

        onSaved(created);
        toast.success("Event created successfully");
      }

      onClose();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
      setProgress(0);
    }
  }

  const resetPasswordForm = () => {
    setForm({
      id: existing?.id ?? "",
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      venue: existing?.venue ?? "",
      venueId: existing?.venueId ?? (user.role === "siteAdmin" ? "" : user.venueId || ""),
      datetime: existing?.date ? new Date(existing.date.seconds * 1000).toISOString().slice(0,16) : "",
      price: existing?.price ?? 0,
      maxTickets: existing?.maxTickets ?? 0,
      isFeatured: user.role === "siteAdmin" ? !!existing?.isFeatured : false,
    });
    setFile(null);
    setProgress(0);
  };

  return {
    form,
    setForm,
    file,
    setFile,
    progress,
    saving,
    onSubmit,
    resetPasswordForm,
    isEdit
  };
}