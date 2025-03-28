import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, CheckCircle, ChevronDown, ChevronUp, AlertTriangle, Signature } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { doc, getDoc, setDoc, updateDoc, collection, increment } from 'firebase/firestore';
import { db } from '../main';
import { useAuth } from '../context/AuthContext';

interface Hike {
  id: string;
  title: string;
  image: string;
  startDate: string;
  endDate: string;
  days: string[];
  times: string[];
  location: string;
  duration: string;
  difficulty: string;
  maxParticipants: number;
  currentParticipants: number;
  description?: string;
  price: number;
}

const formSchema = z.object({
  numberOfParticipants: z.number().min(1, 'At least 1 participant is required').max(10, 'Maximum 10 participants allowed'),
  selectedDate: z.date(),
  selectedTime: z.string(),
  bookerInfo: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number is required'),
    address: z.string().min(5, 'Address is required'),
    birthdate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format'),
  }),
  participants: z.array(
    z.object({
      fullName: z.string().min(2, 'Full name is required'),
      birthdate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format'),
    })
  ),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

type BookingFormValues = z.infer<typeof formSchema>;

enum BookingStep {
  SelectParticipants = 0,
  EnterInformation = 1,
  Waivers = 2,
  Payment = 3,
  Confirmation = 4,
}

const waiverText = `
LIABILITY WAIVER AND ACKNOWLEDGMENT OF RISK

READ CAREFULLY BEFORE SIGNING

I hereby acknowledge that I have voluntarily chosen to participate in the hiking activities with TrailBlazers.

I understand the risks and hazards involved in hiking and outdoor activities, and I voluntarily assume all risk of loss, damage, or injury that may be sustained during the activity.

I hereby release, waive, and discharge TrailBlazers, its officers, employees, and agents from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury that may be sustained by me during the hiking activity.

I agree to follow all rules, regulations, and instructions given by TrailBlazers guides and staff. I certify that I am physically fit and have no medical conditions that would prevent my participation in the activity.

I understand that this waiver is binding on my heirs, assigns, and personal representatives.
`;

const BookHike: React.FC = () => {
  const { hikeId } = useParams<{ hikeId: string }>();
  const navigate = useNavigate();
  const [hike, setHike] = useState<Hike | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SelectParticipants);
  const [participants, setParticipants] = useState<{fullName: string; birthdate: string; waiverSigned: boolean; signatureData?: string}[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalWithTax, setTotalWithTax] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [openWaivers, setOpenWaivers] = useState<number[]>([]);
  const [currentSigningIndex, setCurrentSigningIndex] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const { user } = useAuth();
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfParticipants: 1,
      bookerInfo: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        birthdate: '',
      },
      participants: [],
      agreeToTerms: false,
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchHikeDetails = async () => {
      if (!hikeId) {
        navigate('/404');
        return;
      }

      try {
        setLoading(true);
        const hikeDoc = await getDoc(doc(db, 'hikes', hikeId));
        
        if (hikeDoc.exists()) {
          const hikeData = hikeDoc.data();
          const hike = {
            id: hikeDoc.id,
            ...hikeData,
            currentParticipants: hikeData.currentParticipants || 0
          } as Hike;
          
          setHike(hike);
          generateAvailableDatesFromHike(hike);
        } else {
          navigate('/404');
        }
      } catch (error) {
        console.error('Error fetching hike details:', error);
        toast.error("Failed to load hike details. Please try again.");
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchHikeDetails();
  }, [hikeId, navigate]);

  const generateAvailableDatesFromHike = (hike: Hike) => {
    const startDate = new Date(hike.startDate);
    const endDate = new Date(hike.endDate);
    const dates: Date[] = [];
    
    const dayMap: {[key: string]: number} = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };
    
    const activeDays = hike.days.map(day => dayMap[day]);
    
    // Create a date iterator starting from the start date
    const currentDate = new Date(startDate);
    
    // Iterate until we reach the end date
    while (currentDate <= endDate) {
      // Check if the current day of the week is in our active days
      if (activeDays.includes(currentDate.getDay())) {
        // Add this date to our available dates
        dates.push(new Date(currentDate));
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setAvailableDates(dates);
  };

  useEffect(() => {
    if (hike) {
      const numParticipants = form.watch('numberOfParticipants') || 1;
      const availableSpots = hike.maxParticipants - hike.currentParticipants;
      
      // If no spots available, show message and redirect
      if (availableSpots <= 0) {
        toast.error("No spots available", {
          description: "This hike is fully booked. Please try our other hikes!",
        });
        navigate('/hikes');
        return;
      }

      // Limit number of participants to available spots
      if (numParticipants > availableSpots) {
        form.setValue('numberOfParticipants', availableSpots);
      }

      const basePrice = hike.price * numParticipants;
      const calculatedTax = basePrice * 0.13; // 13% tax
      setTotalPrice(basePrice);
      setTaxAmount(calculatedTax);
      setTotalWithTax(basePrice + calculatedTax);
      
      // Initialize participants array based on number of participants
      const newParticipants = Array(numParticipants).fill(null).map(() => ({
        fullName: '',
        birthdate: '',
        waiverSigned: false
      }));
      
      setParticipants(newParticipants);
      form.setValue('participants', newParticipants.map(p => ({ 
        fullName: p.fullName, 
        birthdate: p.birthdate
      })));
    }
  }, [form.watch('numberOfParticipants'), hike, navigate]);

  const updateParticipant = (index: number, data: Partial<{fullName: string; birthdate: string; waiverSigned: boolean; signatureData?: string}>) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
    
    // Also update form values for validation
    if (data.fullName !== undefined || data.birthdate !== undefined) {
      const formParticipants = form.getValues('participants');
      formParticipants[index] = {
        ...formParticipants[index],
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.birthdate !== undefined ? { birthdate: data.birthdate } : {})
      };
      form.setValue('participants', formParticipants);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === BookingStep.SelectParticipants) {
      if (!selectedDate || !selectedTime) {
        toast.error('Please select a date and time');
        return;
      }
      form.setValue('selectedDate', selectedDate);
      form.setValue('selectedTime', selectedTime);
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
      return;
    }
    
    if (currentStep === BookingStep.EnterInformation) {
      // Validate booker info fields
      const bookerInfoValid = await form.trigger('bookerInfo');
      const termsValid = await form.trigger('agreeToTerms');
      
      // For additional participants, validate their fields if they exist
      let participantsValid = true;
      const participantsData = form.getValues('participants');
      
      // Skip validation for the first participant (primary contact)
      if (participantsData.length > 1) {
        for (let i = 1; i < participantsData.length; i++) {
          const isValid = await form.trigger(`participants.${i}`);
          if (!isValid) {
            participantsValid = false;
            break;
          }
        }
      }
      
      if (!bookerInfoValid || !termsValid || !participantsValid) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Set the primary participant's name from the booker info
      const updatedParticipants = [...participants];
      const bookerInfo = form.getValues('bookerInfo');
      if (updatedParticipants.length > 0) {
        updatedParticipants[0] = {
          ...updatedParticipants[0],
          fullName: bookerInfo.fullName,
          birthdate: bookerInfo.birthdate
        };
        setParticipants(updatedParticipants);
      }
      
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
      return;
    }
    
    if (currentStep === BookingStep.Payment) {
      handlePayment();
      return;
    }
    
    if (currentStep === BookingStep.Waivers) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
      return;
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handlePayment = async () => {
    if (!hike || !selectedDate || !selectedTime || !user) {
      toast.error("Missing required booking information");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Create a new booking ID
      const bookingRef = doc(collection(db, 'bookings'));
      const newBookingId = bookingRef.id;
      setBookingId(newBookingId);

      // Get booker info
      const bookerInfo = form.getValues('bookerInfo');

      // Create the booking document with all required fields
      const bookingData = {
        id: newBookingId,
        hikeId: hike.id,
        userId: user.uid,
        userEmail: user.email || '',
        title: hike.title,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: hike.duration,
        location: hike.location,
        participants: participants.map(p => ({
          fullName: p.fullName || (p === participants[0] ? bookerInfo.fullName : ''),
          birthdate: p.birthdate || (p === participants[0] ? bookerInfo.birthdate : ''),
          waiverSigned: false,
          signatureData: null
        })),
        numberOfParticipants: participants.length,
        price: totalPrice,
        tax: taxAmount,
        totalAmount: totalWithTax,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        waiverStatus: 'pending',
        bookerInfo: {
          fullName: bookerInfo.fullName,
          email: bookerInfo.email,
          phone: bookerInfo.phone,
          address: bookerInfo.address,
          birthdate: bookerInfo.birthdate
        }
      };

      // First update the hike's participant count
      const hikeRef = doc(db, 'hikes', hike.id);
      await updateDoc(hikeRef, {
        currentParticipants: increment(participants.length)
      });

      // Validate booking data before saving
      if (!bookingData.bookerInfo.fullName || !bookingData.bookerInfo.email) {
        throw new Error('Missing required booking information');
      }

      // Then save the booking
      await setDoc(bookingRef, bookingData);

      // Show success message
      toast.success("Booking confirmed successfully!");
      setBookingComplete(true);
      setCurrentStep(BookingStep.Confirmation);
    } catch (error: Error | unknown) {
      console.error('Error processing booking:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process booking. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    // Disable dates before today
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    // Find if date exists in available dates
    return !availableDates.some(availableDate => 
      availableDate.getFullYear() === date.getFullYear() &&
      availableDate.getMonth() === date.getMonth() &&
      availableDate.getDate() === date.getDate()
    );
  };

  const toggleWaiver = (index: number) => {
    if (openWaivers.includes(index)) {
      setOpenWaivers(openWaivers.filter(i => i !== index));
      setCurrentSigningIndex(null);
    } else {
      setOpenWaivers([...openWaivers, index]);
      setCurrentSigningIndex(index);
      
      // Clear the canvas when opening
      setTimeout(() => {
        if (signaturePadRef.current) {
          const context = signaturePadRef.current.getContext('2d');
          if (context) {
            context.clearRect(0, 0, signaturePadRef.current.width, signaturePadRef.current.height);
          }
        }
      }, 100);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setLastPosition({ x, y });
    
    const context = canvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.strokeStyle = '#000';
      context.stroke();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signaturePadRef.current) return;
    
    const canvas = signaturePadRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    context.beginPath();
    context.moveTo(lastPosition.x, lastPosition.y);
    context.lineTo(x, y);
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#000';
    context.stroke();
    
    setLastPosition({ x, y });
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const submitWaiver = () => {
    if (currentSigningIndex === null || !signaturePadRef.current) return;
    
    const canvas = signaturePadRef.current;
    const signatureData = canvas.toDataURL('image/png');
    
    updateParticipant(currentSigningIndex, { 
      waiverSigned: true,
      signatureData
    });
    
    setOpenWaivers(openWaivers.filter(i => i !== currentSigningIndex));
    setCurrentSigningIndex(null);
  };

  const skipWaivers = () => {
    toast.info('You can complete the waivers later from your dashboard', {
      description: 'All waivers must be completed before the hike begins'
    });
    setCurrentStep(BookingStep.Payment);
  };

  const allWaiversSigned = participants.every(p => p.waiverSigned);

  if (!hike) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 min-h-[50vh] flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading booking form...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-24 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-serif font-bold">
                  {currentStep < BookingStep.Confirmation ? "Schedule Your Hike" : "Booking Confirmed!"}
                </h1>
                {currentStep < BookingStep.Confirmation && (
                  <p className="text-gray-600">
                    Book Your Adventure
                  </p>
                )}
              </div>
              {currentStep < BookingStep.Payment && currentStep > BookingStep.SelectParticipants && (
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  className="text-gray-600"
                >
                  Back to {currentStep === BookingStep.EnterInformation ? "Details" : 
                           currentStep === BookingStep.Waivers ? "Information" : "Schedule"}
                </Button>
              )}
            </div>
            
            <div className="p-6">
              {currentStep === BookingStep.SelectParticipants && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-serif font-semibold mb-4">Select Date & Time</h2>
                    <div className="mb-6">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime(undefined); // Reset time when date changes
                        }}
                        className="rounded border pointer-events-auto"
                        disabled={isDateDisabled}
                      />
                    </div>
                    
                    {selectedDate && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">
                          Available Times for {format(selectedDate, 'MMMM d, yyyy')}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {hike.times.map(time => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              className={selectedTime === time ? "bg-nature-500 hover:bg-nature-600" : ""}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Number of Participants ({hike.maxParticipants} spots available)
                      </h3>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => form.setValue('numberOfParticipants', Math.max(1, (form.watch('numberOfParticipants') || 1) - 1))}
                          disabled={(form.watch('numberOfParticipants') || 1) <= 1}
                        >
                          −
                        </Button>
                        <span className="mx-4 font-medium">{form.watch('numberOfParticipants') || 1}</span>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const currentValue = form.watch('numberOfParticipants') || 1;
                            const availableSpots = hike.maxParticipants - hike.currentParticipants;
                            form.setValue('numberOfParticipants', Math.min(availableSpots, currentValue + 1));
                          }}
                          disabled={(form.watch('numberOfParticipants') || 1) >= (hike.maxParticipants - hike.currentParticipants)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-serif font-semibold mb-4">How Booking Works</h2>
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                      <p className="text-gray-700 mb-4">
                        Simply select an available date and time on the calendar. Unavailable times will be greyed out. Each time slot has a maximum capacity of {hike.maxParticipants} participants.
                      </p>
                      <p className="text-gray-700">
                        This hike is available on: {hike.days.join(', ')} from {new Date(hike.startDate).toLocaleDateString()} to {new Date(hike.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 mt-2">
                        Available spots: {hike.maxParticipants - hike.currentParticipants} of {hike.maxParticipants}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Reserve your spot for {hike.title}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-nature-500" />
                        <span>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'} {selectedTime ? `at ${selectedTime}` : ''}</span>
                      </div>
                      <p className="text-gray-700 mb-4">Duration: {hike.duration}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-500">Price per person</div>
                          <div className="text-xl font-bold">${hike.price}</div>
                        </div>
                        <Button 
                          onClick={handleNextStep}
                          disabled={!selectedDate || !selectedTime}
                          className="bg-nature-500 hover:bg-nature-600"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === BookingStep.EnterInformation && (
                <div>
                  <h2 className="text-xl font-serif font-semibold mb-6">Your Information</h2>
                  <Form {...form}>
                    <form>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <FormField
                            control={form.control}
                            name="bookerInfo.fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="bookerInfo.email"
                            render={({ field }) => (
                              <FormItem className="mt-4">
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your.email@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="bookerInfo.phone"
                            render={({ field }) => (
                              <FormItem className="mt-4">
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div>
                          <FormField
                            control={form.control}
                            name="bookerInfo.address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address *</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Your full address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="bookerInfo.birthdate"
                            render={({ field }) => (
                              <FormItem className="mt-4">
                                <FormLabel>Date of Birth (DD/MM/YYYY) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="DD/MM/YYYY" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {participants.length > 1 && (
                        <div className="mt-8">
                          <h2 className="text-xl font-serif font-semibold mb-4">Additional Participants</h2>
                          {participants.slice(1).map((participant, index) => (
                            <div key={index} className="border rounded-lg p-4 mb-4">
                              <h3 className="font-medium mb-3">Participant {index + 2}</h3>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`participant-${index}-name`}>Full Name *</Label>
                                  <Input
                                    id={`participant-${index}-name`}
                                    value={participant.fullName}
                                    onChange={(e) => updateParticipant(index + 1, { fullName: e.target.value })}
                                    className="mt-1"
                                    placeholder="Participant's full name"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`participant-${index}-birthdate`}>Date of Birth (DD/MM/YYYY) *</Label>
                                  <Input
                                    id={`participant-${index}-birthdate`}
                                    value={participant.birthdate}
                                    onChange={(e) => updateParticipant(index + 1, { birthdate: e.target.value })}
                                    className="mt-1"
                                    placeholder="DD/MM/YYYY"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-8">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="terms"
                            checked={form.watch('agreeToTerms')}
                            onCheckedChange={(checked) => 
                              form.setValue('agreeToTerms', checked as boolean)
                            }
                          />
                          <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I agree to the terms and conditions and acknowledge the cancellation policy
                          </label>
                        </div>
                      </div>
                      
                      <div className="mt-8 text-center">
                        <Button 
                          type="button"
                          onClick={handleNextStep}
                          className="w-full md:w-auto bg-nature-500 hover:bg-nature-600"
                        >
                          Continue to Waivers
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
              
              {currentStep === BookingStep.Waivers && (
                <div>
                  <h2 className="text-xl font-serif font-semibold mb-4">E-Waivers</h2>
                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <p className="text-amber-800 mb-2">
                      <AlertTriangle className="h-5 w-5 inline-block mr-2" />
                      <span className="font-medium">Important:</span> Each participant must sign a waiver before the hike.
                    </p>
                    <p className="text-gray-700 text-sm">
                      You can sign now or later, but all waivers must be completed before the hike begins.
                    </p>
                  </div>
                  
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="outline" 
                      onClick={skipWaivers} 
                      className="text-gray-600"
                    >
                      Skip For Now
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {participants.map((participant, index) => (
                      <Collapsible 
                        key={index}
                        open={openWaivers.includes(index)}
                        onOpenChange={() => toggleWaiver(index)}
                        className="border rounded-lg overflow-hidden"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              {participant.waiverSigned ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-amber-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {index === 0 ? "Primary Contact" : `Participant ${index + 1}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {participant.fullName || (index === 0 ? form.getValues('bookerInfo.fullName') : `Unnamed participant ${index + 1}`)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {participant.waiverSigned ? "Signed" : "Pending"}
                              </span>
                              {openWaivers.includes(index) ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 border-t">
                            <h3 className="font-medium mb-3">
                              Waiver for {participant.fullName || (index === 0 ? form.getValues('bookerInfo.fullName') : `Participant ${index + 1}`)}
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 h-48 overflow-y-auto text-sm">
                              <pre className="whitespace-pre-wrap font-sans">
                                {waiverText}
                              </pre>
                            </div>
                            
                            <div className="mb-4">
                              <Label className="mb-2 block">Sign Below:</Label>
                              <div 
                                className="border rounded-lg bg-white relative"
                                style={{ height: '150px' }}
                              >
                                <canvas
                                  ref={signaturePadRef}
                                  width={600}
                                  height={150}
                                  onMouseDown={startDrawing}
                                  onMouseMove={draw}
                                  onMouseUp={endDrawing}
                                  onMouseLeave={endDrawing}
                                  className="cursor-crosshair w-full h-full"
                                  style={{ touchAction: 'none' }}
                                />
                                {!isDrawing && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
                                    <Signature className="mr-2 h-5 w-5" />
                                    <span>Draw your signature here</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                              <Button 
                                variant="outline" 
                                onClick={() => toggleWaiver(index)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={submitWaiver}
                                className="bg-nature-500 hover:bg-nature-600"
                              >
                                Submit Waiver
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                  
                  <div className="mt-8 text-center">
                    <Button 
                      onClick={handleNextStep}
                      className="w-full md:w-auto bg-nature-500 hover:bg-nature-600"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}
              
              {currentStep === BookingStep.Payment && (
                <div>
                  <h2 className="text-xl font-serif font-semibold mb-4">Payment Details</h2>
                  {!allWaiversSigned && (
                    <div className="bg-amber-50 p-4 rounded-lg mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <h3 className="text-amber-800 font-medium">Waivers Pending</h3>
                          <p className="text-amber-700 text-sm">You can complete the waivers later from your dashboard, but they must be signed before the hike begins.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-8">
                    <h3 className="font-medium mb-3">Booking Summary</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Hike:</span>
                        <span className="font-medium">{hike.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{selectedTime || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price per person:</span>
                        <span>${hike.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Participants:</span>
                        <span>{form.watch('numberOfParticipants') || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (13%):</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-medium">Total with Tax:</span>
                        <span className="font-bold">${totalWithTax.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button 
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                        className="w-full bg-nature-500 hover:bg-nature-600 py-3"
                      >
                        {isProcessingPayment ? (
                          <span>Processing...</span>
                        ) : (
                          <span>Complete Booking - ${totalWithTax.toFixed(2)}</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === BookingStep.Confirmation && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Booking Confirmed!</h2>
                  <p className="text-lg text-gray-600 mb-4">
                    Your booking reference is: <span className="font-mono font-semibold">{bookingId.toUpperCase()}</span>
                  </p>
                  <p className="text-gray-600 mb-8">
                    We've sent the booking details to your email. You can find all your bookings in your dashboard.
                  </p>
                  
                  <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 mb-8">
                    <h3 className="font-semibold mb-3">Booking Details</h3>
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hike:</span>
                        <span>{hike.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span>{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Participants:</span>
                        <span>{form.watch('numberOfParticipants')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total paid:</span>
                        <span className="font-semibold">${totalWithTax.toFixed(2)}</span>
                      </div>
                      {!allWaiversSigned && (
                        <div className="mt-4 text-amber-700 bg-amber-50 p-2 rounded text-sm">
                          <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                          Some waivers need to be signed before the hike
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => navigate('/dashboard')}
                      variant="default"
                      className="bg-nature-500 hover:bg-nature-600"
                    >
                      Go to Dashboard
                    </Button>
                    <Button 
                      onClick={() => navigate('/')}
                      variant="outline"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookHike;
