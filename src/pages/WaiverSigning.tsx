import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Pen, CheckCircle, ChevronUp, ChevronDown, Signature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../main';

const WaiverSigning: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [openWaivers, setOpenWaivers] = useState<number[]>([]);
  const [currentSigningIndex, setCurrentSigningIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId || !user) return;

      try {
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (bookingDoc.exists() && bookingDoc.data().userId === user.uid) {
          setBookingData(bookingDoc.data());
        } else {
          toast.error('Booking not found');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, user, navigate]);

  const toggleWaiver = (index: number) => {
    if (openWaivers.includes(index)) {
      setOpenWaivers(openWaivers.filter(i => i !== index));
      setCurrentSigningIndex(null);
    } else {
      setOpenWaivers([...openWaivers, index]);
      setCurrentSigningIndex(index);
      
      // Clear the canvas when opening
      setTimeout(() => {
        if (canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      }, 100);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
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
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
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

  const submitWaiver = async () => {
    if (currentSigningIndex === null || !canvasRef.current || !bookingData) return;
    
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    
    try {
      // Update the participant's waiver status
      const updatedParticipants = [...bookingData.participants];
      updatedParticipants[currentSigningIndex] = {
        ...updatedParticipants[currentSigningIndex],
        waiverSigned: true,
        signatureData
      };
      
      // Check if all waivers are now signed
      const allSigned = updatedParticipants.every(p => p.waiverSigned);
      
      // Update the booking document
      await updateDoc(doc(db, 'bookings', bookingId), {
        participants: updatedParticipants,
        waiverStatus: allSigned ? 'completed' : 'pending'
      });
      
      // Update local state
      setBookingData({
        ...bookingData,
        participants: updatedParticipants,
        waiverStatus: allSigned ? 'completed' : 'pending'
      });
      
      setOpenWaivers(openWaivers.filter(i => i !== currentSigningIndex));
      setCurrentSigningIndex(null);
      
      toast.success('Waiver signed successfully');
      
      if (allSigned) {
        toast.success('All waivers completed!');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error) {
      console.error('Error updating waiver:', error);
      toast.error('Failed to save waiver');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 min-h-[50vh] flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading waiver details...</p>
        </div>
      </Layout>
    );
  }

  if (!bookingData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 min-h-[50vh] flex items-center justify-center">
          <p className="text-lg text-gray-600">Booking not found</p>
        </div>
      </Layout>
    );
  }

  const pendingWaivers = bookingData.participants.filter((p: any) => !p.waiverSigned);

  return (
    <Layout>
      <div className="pt-24 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-serif font-bold">Complete Waivers</h1>
                <p className="text-gray-600 mt-1">
                  {pendingWaivers.length} {pendingWaivers.length === 1 ? 'waiver' : 'waivers'} remaining
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>

            {pendingWaivers.length > 0 ? (
              <div className="space-y-4">
                {bookingData.participants.map((participant: any, index: number) => !participant.waiverSigned && (
                  <Collapsible 
                    key={index}
                    open={openWaivers.includes(index)}
                    onOpenChange={() => toggleWaiver(index)}
                    className="border rounded-lg overflow-hidden bg-white"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full border-2 border-amber-500" />
                          <div>
                            <p className="font-medium">
                              {index === 0 ? "Primary Contact" : `Participant ${index + 1}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {participant.fullName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-amber-600">Pending</span>
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
                          Waiver for {participant.fullName}
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4 h-48 overflow-y-auto text-sm">
                          <pre className="whitespace-pre-wrap font-sans">
                            {`LIABILITY WAIVER AND ACKNOWLEDGMENT OF RISK

READ CAREFULLY BEFORE SIGNING

I hereby acknowledge that I have voluntarily chosen to participate in the hiking activities with TrailBlazers.

I understand the risks and hazards involved in hiking and outdoor activities, and I voluntarily assume all risk of loss, damage, or injury that may be sustained during the activity.

I hereby release, waive, and discharge TrailBlazers, its officers, employees, and agents from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury that may be sustained by me during the hiking activity.

I agree to follow all rules, regulations, and instructions given by TrailBlazers guides and staff. I certify that I am physically fit and have no medical conditions that would prevent my participation in the activity.

I understand that this waiver is binding on my heirs, assigns, and personal representatives.`}
                          </pre>
                        </div>
                        
                        <div className="mb-4">
                          <Label className="mb-2 block">Sign Below:</Label>
                          <div 
                            className="border rounded-lg bg-white relative"
                            style={{ height: '150px' }}
                          >
                            <canvas
                              ref={canvasRef}
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
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">All Waivers Completed!</h2>
                <p className="text-gray-600 mb-6">All participants have signed their waivers.</p>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-nature-500 hover:bg-nature-600"
                >
                  Return to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WaiverSigning;
