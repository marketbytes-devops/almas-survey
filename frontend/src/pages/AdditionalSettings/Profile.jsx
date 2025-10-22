import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { FaCamera, FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import { FormProvider, useForm } from 'react-hook-form';
import InputField from '../../components/Input';
import Button from '../../components/Button';

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
  const [imagePreview, setImagePreview] = useState(null);
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
        setImagePreview(data.image || null);
      })
      .catch((error) => {
        setError('Failed to fetch profile data');
        console.error(error);
      });
  }, [profileForm]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
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
      setImagePreview(response.data.image || null);
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

  return (
    <motion.div
      className="min-h-screen p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Profile Settings</h1>
        </motion.div>

        {/* Messages */}
        {error && (
          <motion.div
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </motion.div>
        )}
        {message && (
          <motion.div
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-green-600 text-sm font-medium">{message}</p>
          </motion.div>
        )}

        {/* Profile Header Card */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-100">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-600 rounded-full p-1.5 cursor-pointer transition-colors">
                <FaCamera className="w-3 h-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {profileForm.watch('name')}
              </h2>
              <p className="text-gray-600 text-sm flex items-center mt-1">
                <FaMapMarkerAlt className="w-4 h-4 mr-1" />
                {profileForm.watch('address')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Information Block */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">User Information</h3>
          <FormProvider {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileUpdate)} className="space-y-6">
              <div className="flex flex-col items-center">
                {imagePreview && (
                  <motion.img
                    src={imagePreview}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-indigo-100 shadow-sm"
                    onError={() => setImagePreview(null)}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
                />
              </div>
              <InputField
                label="Email Address"
                name="email"
                type="email"
                readOnly
                className="w-full p-3 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <InputField
                label="Name"
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
                label="Address"
                name="address"
                type="text"
              />
              <InputField
                label="Phone Number"
                name="phone_number"
                type="tel"
                rules={{
                  pattern: {
                    value: /^\+?[\d\s-]{7,15}$/,
                    message: "Enter a valid phone number",
                  },
                }}
              />
              <Button
                type="submit"
                className="w-full p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition duration-300 font-medium"
              >
                Update Profile
              </Button>
            </form>
          </FormProvider>
        </motion.div>

        {/* Change Password Block */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
          <FormProvider {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-6">
              <InputField
                label="New Password"
                name="newPassword"
                type="password"
                rules={{ required: "New password is required" }}
              />
              <InputField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                rules={{ required: "Confirm password is required" }}
              />
              <Button
                type="submit"
                className="w-full p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition duration-300 font-medium"
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