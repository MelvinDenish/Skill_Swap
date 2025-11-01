import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { reviewAPI, sessionAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { Loader2, Calendar, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewItem {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerProfilePictureUrl?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function UserProfile() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [skillTopic, setSkillTopic] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [{ data: userData }, { data: reviewsData }] = await Promise.all([
          userAPI.getUser(id),
          reviewAPI.getUserReviews(id),
        ]);
        setProfile(userData);
        setReviews(reviewsData);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const createSession = async () => {
    if (!id) return;
    if (!skillTopic || !scheduledTime) {
      toast.error('Please fill skill topic and time');
      return;
    }
    try {
      await sessionAPI.createSession({
        partnerId: id,
        skillTopic,
        scheduledTime,
        duration,
        isTeacher,
      });
      toast.success('Session request sent');
    } catch {
      toast.error('Failed to create session');
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Navbar />
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
      </div>
    );

  const canBook = user && user.id !== profile.id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-6"
        >
          <img
            src={profile.profilePictureUrl || '/default-avatar.svg'}
            className="w-32 h-32 rounded-full object-cover border-2 border-indigo-500"
            alt="Profile"
          />
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {profile.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 italic">
              {profile.bio || 'No bio available.'}
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                Level: {profile.level || 'N/A'}
              </span>
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-500" />{' '}
                {profile.rating?.toFixed(1) || '0.0'}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {profile.completedSessions || 0} Sessions
              </span>
            </div>
            <div className="pt-3">
              <p className="font-semibold">Availability:</p>
              <p className="text-gray-700 dark:text-gray-300">
                {profile.availability || 'Not specified'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-3">Skills Offered</h2>
            {profile.skillsOffered?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.skillsOffered.map((s: string) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills listed</p>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-3">Skills Wanted</h2>
            {profile.skillsWanted?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.skillsWanted.map((s: string) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded-full text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills listed</p>
            )}
          </div>
        </div>

        {/* Session Request Form */}
        {canBook && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-6"
          >
            <h2 className="text-lg font-semibold mb-4">
              Request a Learning Session
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Skill Topic
                </label>
                <input
                  value={skillTopic}
                  onChange={(e) => setSkillTopic(e.target.value)}
                  className="w-full border rounded-lg p-2 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="e.g., React Basics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date & Time
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full pl-10 border rounded-lg p-2 dark:bg-neutral-800 dark:border-neutral-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration (minutes)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      setDuration(parseInt(e.target.value || '60', 10))
                    }
                    className="w-full pl-10 border rounded-lg p-2 dark:bg-neutral-800 dark:border-neutral-700"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="isTeacher"
                  type="checkbox"
                  checked={isTeacher}
                  onChange={(e) => setIsTeacher(e.target.checked)}
                />
                <label htmlFor="isTeacher" className="text-sm">
                  I will teach
                </label>
              </div>
            </div>
            <button
              onClick={createSession}
              className="mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition text-white font-medium py-2 px-4 rounded-lg"
            >
              Send Request
            </button>
          </motion.div>
        )}

        {/* Reviews Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="border-b border-gray-100 dark:border-neutral-800 pb-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={r.reviewerProfilePictureUrl || '/default-avatar.svg'}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{r.reviewerName}</div>
                      <div className="text-yellow-500 text-sm">
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {r.comment}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
