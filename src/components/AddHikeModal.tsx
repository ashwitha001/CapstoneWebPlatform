import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../main';
import { X } from 'lucide-react';

interface AddHikeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddHikeModal: React.FC<AddHikeModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    days: [] as string[],
    times: [] as string[],
    duration: '',
    maxParticipants: 10,
    price: 0,
    location: '',
    difficulty: 'Moderate',
    description: '',
    currentParticipants: 0,
    status: 'upcoming',
    bookedGuests: [],
    assignedGuide: null,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1974' // Default image
  });

  const [newTime, setNewTime] = useState('');

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleAddTime = () => {
    if (newTime && !formData.times.includes(newTime)) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, newTime]
      }));
      setNewTime('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a hike name');
      return;
    }

    if (formData.days.length === 0) {
      alert('Please select at least one day of the week');
      return;
    }

    if (formData.times.length === 0) {
      alert('Please add at least one hike time');
      return;
    }

    try {
      console.log('Attempting to add hike to Firestore...');
      const hikesCollection = collection(db, 'hikes');
      const docRef = await addDoc(hikesCollection, formData);
      console.log('Successfully added hike with ID:', docRef.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding hike:', error);
      alert('Failed to add hike. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Add New Hike</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hike Name</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="e.g. Banff Sulphur Mountain Trail"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Days of the Week</label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.days.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="mr-1"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hike Times</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={handleAddTime}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Time
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.times.map((time, index) => (
                  <span key={index} className="bg-gray-100 px-2 py-1 rounded">
                    {time}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. 4 hours"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price per Person ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="e.g. Banff National Park, AB"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full p-2 border rounded"
                required
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Describe the hike experience..."
                required
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Hike
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddHikeModal; 