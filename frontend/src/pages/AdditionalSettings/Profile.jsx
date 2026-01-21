/* src/pages/AdditionalSettings/Profile.jsx */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../components/PermissionsContext/PermissionsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCamera } from 'react-icons/fa';
import { RiChatAiFill } from "react-icons/ri";
import { FiSave, FiLock, FiUser, FiInfo } from "react-icons/fi";
import apiClient from '../../api/apiClient';
import { FormProvider, useForm } from 'react-hook-form';
import Input from '../../components/Input';
import PageHeader from '../../components/PageHeader';
import fallbackProfile from '../../assets/images/profile-icon.png';

const Profile = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const profileForm = useForm({
    defaultValues: {
      email: '',
      name: '',
      username: '',
      address: '',
      phone_number: '',
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(fallbackProfile);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!hasPermission("Profile", "view")) {
      navigate("/dashboard");
      return;
    }
    apiClient
      .get('/auth/profile/')
      .then((response) => {
        const data = response.data || {};
        profileForm.reset({
          email: data.email || '',
          name: data.name || '',
          username: data.username || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
        });

        if (data.image) {
          setImagePreview(data.image);
        } else {
          setImagePreview(fallbackProfile);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch profile data');
        setImagePreview(fallbackProfile);
        setLoading(false);
      });
  }, [profileForm, hasPermission, navigate]);

  const handleImageChange = (e) => {
    if (!hasPermission("Profile", "edit")) {
      setError("You do not have permission to edit your profile image.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const onProfileUpdate = async (data) => {
    setError('');
    setSuccess('');
    setSavingProfile(true);

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await apiClient.put('/auth/profile/', formData);
      // Update form with refined data from backend if needed
      // profileForm.reset(response.data || {}); 

      if (response.data.image) {
        setImagePreview(response.data.image);
      }

      setImage(null);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordChange = async (data) => {
    setError('');
    setSuccess('');

    if (data.newPassword !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSavingPassword(true);

    const formData = new FormData();
    formData.append('new_password', data.newPassword);
    formData.append('confirm_password', data.confirmPassword);

    try {
      await apiClient.post('/auth/change-password/', formData);
      setSuccess('Password changed successfully');
      passwordForm.reset();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto space-y-6 min-h-screen bg-slate-50">
      <PageHeader title="Profile Settings" subtitle="Manage your account information" />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center shadow-sm"
          >
            <FiInfo className="mr-2" /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center shadow-sm"
          >
            <FiInfo className="mr-2" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center h-full">
            <div className="relative mb-6 group">
              <div className="w-40 h-40 rounded-full p-1 border-2 border-slate-200 bg-white">
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => { e.target.src = fallbackProfile; }}
                />
              </div>
              <label className={`absolute bottom-1 right-2 bg-[#4c7085] hover:bg-[#3a5d72] text-white p-3 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105 ${!hasPermission("Profile", "edit") ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <FaCamera size={18} />
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={!hasPermission("Profile", "edit")} />
              </label>
            </div>

            <h2 className="text-xl font-bold text-slate-800">{profileForm.watch('name') || 'User'}</h2>
            <p className="text-slate-500 text-sm mt-1">{profileForm.watch('email') || 'email@example.com'}</p>

            <div className="w-full mt-8 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="flex items-center"><RiChatAiFill className="mr-2 text-[#4c7085]" /> Username</span>
                <span className="font-medium">{profileForm.watch('username') || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="flex items-center"><FiUser className="mr-2 text-[#4c7085]" /> Role</span>
                <span className="font-medium capitalize">Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="col-span-1 lg:col-span-2 space-y-6">

          {/* Edit Profile Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center">
              <FiUser className="mr-2 text-[#4c7085]" /> User Information
            </h3>
            <FormProvider {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileUpdate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" name="name" rules={{ required: "Name is required" }} />
                  <Input label="Username" name="username" rules={{ required: "Username is required" }} />
                  <Input label="Phone Number" name="phone_number" placeholder="+974 1234 5678" />
                  <Input label="Email Address" name="email" readOnly disabled={true} />
                  <div className="md:col-span-2">
                    <Input label="Address" name="address" placeholder="Full address" />
                  </div>
                </div>
                {hasPermission("Profile", "edit") && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 bg-[#4c7085] hover:bg-[#3a5d72] text-white font-medium rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                    >
                      {savingProfile ? 'Saving...' : <><FiSave className="mr-2" /> Update Profile</>}
                    </button>
                  </div>
                )}
              </form>
            </FormProvider>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center">
              <FiLock className="mr-2 text-[#4c7085]" /> Change Password
            </h3>
            <FormProvider {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    rules={{ required: "Required", minLength: { value: 6, message: "Min 6 chars" } }}
                  />
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    rules={{ required: "Required" }}
                  />
                </div>
                {hasPermission("Profile", "edit") && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="btn-secondary active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                    >
                      {savingPassword ? 'Updating...' : <><FiLock className="mr-2" /> Change Password</>}
                    </button>
                  </div>
                )}
              </form>
            </FormProvider>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;