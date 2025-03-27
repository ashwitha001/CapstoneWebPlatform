
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const WaiverSigning: React.FC = () => {
  const { hikeId } = useParams<{ hikeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    // Fetch booking data from localStorage
    const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
    const booking = userBookings.find((b: any) => b.hikeId === hikeId);
    if (booking) {
      setBookingData(booking);
    }
  }, [hikeId]);

  // Mock data for a waiver if no booking is found
  const waiverData = bookingData || {
    hikeName: 'Banff Sulphur Mountain Trail',
    hikeDate: '2024-06-15',
    participants: [
      { id: 'p1', name: user?.name || 'Primary Contact', isPrimary: true, waiver: 'pending' }
    ]
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };

  const handleSubmitWaiver = () => {
    if (!signature) {
      toast.error('Please sign the waiver');
      return;
    }

    // Update booking waiver status in localStorage
    if (hikeId) {
      const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
      const updatedBookings = userBookings.map((booking: any) => {
        if (booking.hikeId === hikeId) {
          return {
            ...booking,
            waiverStatus: 'completed'
          };
        }
        return booking;
      });
      localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
    }

    toast.success('Waiver signed successfully', {
      description: 'Your waiver has been submitted'
    });
    
    // Navigate back to the dashboard
    navigate('/dashboard');
  };

  const handleSkipForNow = () => {
    toast.info('You can complete the waiver later');
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="pt-24 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-serif">E-Waivers</CardTitle>
              <CardDescription>
                Complete your waiver form for {waiverData.hikeName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="text-amber-800 font-medium text-lg">Important: Each participant must sign a waiver before the hike.</h3>
                    <p className="text-amber-700">You can sign now or later, but all waivers must be completed before the hike begins.</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 border rounded-md overflow-hidden">
                <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                      <Pen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Primary Contact</p>
                      <p className="text-sm text-gray-500">{user?.name || waiverData.participants[0].name}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                    Pending
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-medium mb-2">Waiver for {user?.name || waiverData.participants[0].name}</h3>
                  
                  <div className="bg-gray-50 p-4 mb-4 rounded-md">
                    <h4 className="text-lg font-semibold mb-2">LIABILITY WAIVER AND ACKNOWLEDGMENT OF RISK</h4>
                    <p className="mb-3 font-medium">READ CAREFULLY BEFORE SIGNING</p>
                    <p className="mb-3">
                      I hereby acknowledge that I have voluntarily chosen to participate in the hiking activities with TrailBlazers.
                    </p>
                    <p className="mb-4">
                      I understand the risks and hazards involved in hiking and outdoor activities, and I voluntarily assume all risk of loss, damage, 
                      or injury that may be sustained during the activity.
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="font-medium mb-2">Sign Below:</p>
                    <div className="border rounded-md p-1 relative">
                      <canvas 
                        ref={canvasRef}
                        width={740}
                        height={150}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                        className="w-full bg-white cursor-crosshair"
                      />
                      {!signature && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
                          <Pen className="h-5 w-5 mr-2" />
                          Draw your signature here
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={clearCanvas}
                      >
                        Clear Signature
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={handleSkipForNow}
              >
                Skip For Now
              </Button>
              <Button 
                className="bg-nature-500 hover:bg-nature-600"
                onClick={handleSubmitWaiver}
                disabled={!signature}
              >
                Submit Waiver
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WaiverSigning;
