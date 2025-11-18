import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { FaCamera, FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import { FormProvider, useForm } from 'react-hook-form';
import InputField from '../../components/Input';
import Button from '../../components/Button';
import fallbackProfile from '../../assets/images/profile-icon.png'; 

const Profile = () => {
  const navigate = useNavigate();
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
  const [message, setMessage] = useState('');

  useEffect(() => {
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
      })
      .catch((error) => {
        setError('Failed to fetch profile data');
        console.error(error);
        setImagePreview(fallbackProfile); 
      });
  }, [profileForm]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const onProfileUpdate = async (data) => {
    setError('');
    setMessage('');

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
      profileForm.reset(response.data || {});
      
      if (response.data.image) {
        setImagePreview(response.data.image);
      } else {
        setImagePreview(fallbackProfile);
      }

      setImage(null);
      setMessage('Profile updated successfully');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  const onPasswordChange = async (data) => {
    setError('');
    setMessage('');

    if (data.newPassword !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const formData = new FormData();
    formData.append('new_password', data.newPassword);
    formData.append('confirm_password', data.confirmPassword);

    try {
      await apiClient.put('/auth/profile/', formData);
      setMessage('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to change password');
    }
  };

  const ProfileImage = ({ src, alt = "Profile", className = "" }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.src = fallbackProfile;
      }}
    />
  );

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 text-center sm:text-left">
            Profile Settings
          </h1>
        </motion.div>
        {error && (
          <motion.div
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </motion.div>
        )}
        {message && (
          <motion.div
            className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-green-600 text-sm font-medium">{message}</p>
          </motion.div>
        )}
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-100 shadow-md">
                <ProfileImage
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] rounded-full p-3 cursor-pointer transition-all shadow-lg">
                <FaCamera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-medium text-gray-900">
                {profileForm.watch('name') || 'Your Name'}
              </h2>
              <p className="text-gray-600 text-sm flex items-center justify-center sm:justify-start mt-2">
                <FaMapMarkerAlt className="w-4 h-4 mr-2 text-indigo-500" />
                {profileForm.watch('address') || 'No address added'}
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-8"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-medium text-gray-900 mb-8">User Information</h3>
          <FormProvider {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileUpdate)} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <ProfileImage
                  src={imagePreview}
                  alt="Profile Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg mb-4"
                />
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full max-w-sm p-3 border-2 border-dashed border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 transition bg-indigo-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#4c7085] file:to-[#6b8ca3] file:text-white hover:file:from-[#3a586d] hover:file:to-[#54738a]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  readOnly
                  className="bg-gray-100 text-gray-600 py-2 px-3 rounded-lg cursor-not-allowed"
                />
                <InputField
                  label="Full Name"
                  name="name"
                  type="text"
                  rules={{ required: "Name is required" }}
                />
                <InputField
                  label="Username"
                  name="username"
                  type="text"
                  rules={{ required: "Username is required" }}
                />
                <InputField
                  label="Phone Number"
                  name="phone_number"
                  type="tel"
                  placeholder="+974 1234 5678"
                  rules={{
                    pattern: {
                      value: /^\+?[\d\s-]{7,15}$/,
                      message: "Enter a valid phone number",
                    },
                  }}
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Address"
                    name="address"
                    type="text"
                    placeholder="Your full address"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-3 text-sm font-medium bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white rounded-lg transition transform"
              >
                Update Profile
              </Button>
            </form>
          </FormProvider>
        </motion.div>
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-medium text-gray-900 mb-8">Change Password</h3>
          <FormProvider {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-6">
              <InputField
                label="New Password"
                name="newPassword"
                type="password"
                rules={{ 
                  required: "New password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" }
                }}
              />
              <InputField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                rules={{ required: "Please confirm your password" }}
              />
              <Button
                type="submit"
                className="w-full py-3 text-sm font-medium bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white rounded-lg transition transform"
              >
                Change Password
              </Button>
            </form>
          </FormProvider>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;