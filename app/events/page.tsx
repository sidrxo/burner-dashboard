"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection, getDocs, orderBy, query, setDoc, doc, updateDoc, deleteDoc,
  Timestamp, writeBatch, where, getDoc
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "@/components/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Edit, Trash2, Star, StarOff, Calendar, MapPin, Ticket, PoundSterling, 
  Clock, Users, Eye, MoreVertical, TrendingUp, AlertCircle
} from "lucide-react";
import RequireAuth from "@/components/require-auth";
import { toast } from "sonner";

type Event = { id: string } & any;

type Venue = {
  id: string;
  name: string;
};

function EventsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

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

  // UPDATED: Only allow site admins to toggle featured status
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

  const EventSkeleton = () => (
    <Card className="overflow-hidden group">
      <div className="relative">
        <Skeleton className="h-56 w-full" />
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );

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

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access denied for users without proper permissions
  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardHeader>
          <h2 className="text-xl font-bold text-center">Access Denied</h2>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Please log in to view events.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (user.role !== "siteAdmin" && user.role !== "venueAdmin" && user.role !== "subAdmin") {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardHeader>
          <h2 className="text-xl font-bold text-center">Access Denied</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              You don't have permission to view events.
            </p>
            <div className="text-sm bg-muted p-2 rounded">
              <p><strong>Your role:</strong> {user.role}</p>
              <p><strong>Required roles:</strong> siteAdmin, venueAdmin, or subAdmin</p>
              {user.venueId && <p><strong>Your venue:</strong> {user.venueId}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Event Management
      
          </h2>
          <p className="text-muted-foreground mt-1">
            {user.role === "siteAdmin" 
              ? "Manage events across all venues and track ticket sales"
              : "Manage events for your venue and track ticket sales"
            }
          </p>
        </div>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>
            <EventForm
              existing={editing}
              user={user}
              venues={venues}
              onClose={() => setOpenForm(false)}
              onSaved={(e) => {
                setEvents(prev => {
                  const rest = prev.filter(x => x.id !== e.id);
                  return [e, ...rest].sort((a,b)=>Number(!!b.isFeatured)-Number(!!a.isFeatured));
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative max-w-sm w-full">
          <Input 
            placeholder="Search events..." 
            value={search}
            onChange={e => setSearch(e.target.value)} 
            className="pl-4 pr-4 h-11 border-2 focus:border-primary/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{events.length} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>{events.filter(e => e.isFeatured).length} Featured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>{events.filter(e => e.ticketsSold >= e.maxTickets).length} Sold Out</span>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({length: 6}).map((_, i) => <EventSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center border-dashed border-2">
              <Calendar className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
              <h3 className="text-xl font-semibold mb-3">No events found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {search 
                  ? "Try adjusting your search terms to find what you're looking for" 
                  : user.role === "siteAdmin"
                    ? "Create your first event to get started with managing your events"
                    : "Create your first event for your venue to get started"
                }
              </p>
              {!search && (
                <Button onClick={() => setOpenForm(true)} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              )}
            </Card>
          </div>
        ) : (
          filtered.map((ev, index) => {
            const eventStatus = getEventStatus(ev);
            const ticketProgress = getTicketProgress(ev);
            
            return (
              <Card 
                key={`event-${ev.id}-${index}`} 
                className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-background to-background/50"
              >
                {/* Image Header */}
                <div className="relative overflow-hidden">
                {ev.imageUrl ? (
                  <div className="relative h-56 overflow-hidden">
                  <img 
                    src={ev.imageUrl} 
                    alt={ev.name} 
                    className="w-full h-full object-cover transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-56 bg-gradient-to-br from-muted via-muted/50 to-muted/30 flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Badges below image */}
                <div className="flex gap-2 p-4 pt-4 pb-0">
                  {ev.isFeatured && (
                  <Badge className="bg-yellow-500/90 text-white border-0 shadow-lg backdrop-blur-sm">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                  )}
                  <Badge 
                  variant={eventStatus.variant}
                  className="backdrop-blur-sm shadow-lg border-0"
                  >
                  {eventStatus.label}
                  </Badge>
                </div>
                
                {/* Price Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-background/90 text-foreground border shadow-lg backdrop-blur-sm text-lg font-bold px-3 py-1">
                  {formatCurrency(ev.price)}
                  </Badge>
                </div>
                </div>
                
                <CardContent className="p-6 space-y-4">
                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {ev.name || "Untitled Event"}
                  </h3>
                  {ev.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {ev.description}
                  </p>
                  )}
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                  {ev.date && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                    <div className="font-medium">
                      {new Date(ev.date.seconds * 1000).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                      })}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(ev.date.seconds * 1000).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                      })}
                    </div>
                    </div>
                  </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium truncate">{ev.venue || "Venue TBA"}</div>
                  </div>
                  </div>
                </div>

                {/* Ticket Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{ev.ticketsSold || 0} / {ev.maxTickets || 0} tickets</span>
                  </div>
                  <div className="text-muted-foreground">
                    {Math.round(ticketProgress)}% sold
                  </div>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                    ticketProgress >= 100 
                      ? 'bg-red-500' 
                      : ticketProgress >= 80 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                    }`}
                    style={{ width: `${ticketProgress}%` }}
                  />
                  </div>
                </div>
                </CardContent>

                <Separator />

                <CardFooter className="p-4 bg-muted/30">
                <div className="flex gap-2 w-full">
                  <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setEditing(ev); setOpenForm(true); }}
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                  </Button>
                  
                  {/* UPDATED: Only show feature button for site admins */}
                  {user.role === "siteAdmin" && (
                    <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onToggleFeatured(ev)}
                    className={`flex-1 transition-colors ${
                      ev.isFeatured 
                      ? 'hover:bg-yellow-500 hover:text-white' 
                      : 'hover:bg-yellow-500 hover:text-white'
                    }`}
                    >
                    {ev.isFeatured ? (
                      <>
                      <StarOff className="h-3 w-3 mr-2" />
                      Unfeature
                      </>
                    ) : (
                      <>
                      <Star className="h-3 w-3 mr-2" />
                      Feature
                      </>
                    )}
                    </Button>
                  )}

                  <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground transition-colors">
                    <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Delete Event
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{ev.name}"? This will also remove all associated tickets and cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(ev)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Event
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <RequireAuth>
      <EventsPageContent />
    </RequireAuth>
  );
}

// UPDATED: Enhanced Event Form component with featured checkbox only for site admins
function EventForm({
  existing,
  user,
  venues,
  onSaved,
  onClose,
}: {
  existing: Event | null;
  user: any;
  venues: Venue[];
  onSaved: (e: Event) => void;
  onClose: () => void;
}) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    id: existing?.id ?? "",
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    venue: existing?.venue ?? "",
    venueId: existing?.venueId ?? (user.role === "siteAdmin" ? "" : user.venueId || ""),
    datetime: existing?.date ? new Date(existing.date.seconds * 1000).toISOString().slice(0,16) : "",
    price: existing?.price ?? "",
    maxTickets: existing?.maxTickets ?? "",
    // UPDATED: Only allow site admins to set featured status
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
          // UPDATED: Preserve existing featured status if user is not site admin
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

        // UPDATED: Only update featured status if user is site admin
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
          // UPDATED: Only set featured status if user is site admin
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

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="id">Event ID *</Label>
          <Input 
            id="id" 
            value={form.id} 
            onChange={e => setForm(s=>({...s, id: e.target.value}))} 
            placeholder="unique-event-id"
            required 
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Event Name *</Label>
          <Input 
            id="name" 
            value={form.name} 
            onChange={e => setForm(s=>({...s, name: e.target.value}))} 
            placeholder="Summer Music Festival"
            required 
          />
        </div>
        
        {user.role === "siteAdmin" && (
          <div className="space-y-2">
            <Label htmlFor="venue-select">Venue *</Label>
            <select
              id="venue-select"
              className="w-full p-2 border border-input bg-background rounded-md"
              value={form.venueId}
              onChange={(e) => setForm(s=>({...s, venueId: e.target.value}))}
              required
            >
              <option value="">Select a venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Textarea 
          id="desc" 
          value={form.description} 
          onChange={e => setForm(s=>({...s, description: e.target.value}))} 
          placeholder="Brief description of your event..."
          rows={3}
        />
        <div className="text-xs text-muted-foreground text-right">
          {form.description.length} / 390 characters
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dt">Date & Time *</Label>
        <Input 
          id="dt" 
          type="datetime-local" 
          value={form.datetime} 
          onChange={e => setForm(s=>({...s, datetime: e.target.value}))} 
          required 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ticket Price (£) *</Label>
          <Input 
            type="number" 
            step="0.01" 
            min="0"
            value={form.price} 
            onChange={e => setForm(s=>({...s, price: Number(e.target.value)}))} 
            placeholder="25.00"
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>Maximum Tickets *</Label>
          <Input 
            type="number" 
            min="1"
            value={form.maxTickets} 
            onChange={e => setForm(s=>({...s, maxTickets: Number(e.target.value)}))} 
            placeholder="100"
            required 
          />
        </div>
      </div>

      {/* UPDATED: Only show featured checkbox for site admins */}
      {user.role === "siteAdmin" && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="featured" 
            checked={form.isFeatured} 
            onCheckedChange={(v)=>setForm(s=>({...s, isFeatured: !!v}))}
          />
          <Label htmlFor="featured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Mark as featured event
          </Label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="img">Event Image</Label>
        <Input 
          id="img" 
          type="file" 
          accept="image/*" 
          onChange={e => setFile(e.target.files?.[0] ?? null)} 
        />
        <div className="text-xs text-muted-foreground">
          Supported formats: JPEG, PNG, GIF (max 5MB)
        </div>
        {progress > 0 && progress < 100 && (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="text-xs text-center text-muted-foreground">
              Uploading... {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : (isEdit ? "Update Event" : "Create Event")}
        </Button>
      </div>
    </form>
  );
}