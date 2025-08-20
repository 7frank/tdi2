import React, { useState } from 'react';
import { Inject } from '@tdi2/di-core';
import { UserServiceInterface } from '../services/UserService';
import { Address } from '../types/User';

interface UserProfileProps {
  services: {
    userService: Inject<UserServiceInterface>;
  };
}

export function UserProfile({ services }: UserProfileProps) {
  const { userService } = services;
  const { currentUser, isAuthenticated, profile, loading, error } = userService.state;

  if (!isAuthenticated) {
    return <LoginForm userService={userService} />;
  }

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Profile Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Welcome, {currentUser?.name}</h2>
            <p className="text-gray-600">{currentUser?.email}</p>
          </div>
          <button
            onClick={() => userService.logout()}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Profile Sections */}
      <div className="p-6 space-y-6">
        <ProfileInfo userService={userService} profile={profile} />
        <AddressManager userService={userService} profile={profile} />
      </div>
    </div>
  );
}

interface LoginFormProps {
  userService: UserServiceInterface;
}

function LoginForm({ userService }: LoginFormProps) {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const { loading, error } = userService.state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await userService.login(email, password);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Sign In</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="text-sm text-gray-600 text-center">
          <p>Demo credentials:</p>
          <p>Email: demo@example.com | Password: password</p>
        </div>
      </form>
    </div>
  );
}

interface ProfileInfoProps {
  userService: UserServiceInterface;
  profile: any;
}

function ProfileInfo({ userService, profile }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || ''
  });

  const handleSave = async () => {
    try {
      await userService.updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (isEditing) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Edit Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Profile Information</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          Edit
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <p className="mt-1 text-sm text-gray-900">{profile?.name || 'Not set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-sm text-gray-900">{profile?.email || 'Not set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <p className="mt-1 text-sm text-gray-900">{profile?.phone || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}

interface AddressManagerProps {
  userService: UserServiceInterface;
  profile: any;
}

function AddressManager({ userService, profile }: AddressManagerProps) {
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'shipping' as 'shipping' | 'billing',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const handleAddAddress = async () => {
    try {
      await userService.addAddress({
        ...newAddress,
        isDefault: false
      });
      setNewAddress({
        type: 'shipping',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      });
      setIsAddingAddress(false);
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Addresses</h3>
        <button
          onClick={() => setIsAddingAddress(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Address
        </button>
      </div>

      {/* Existing Addresses */}
      <div className="space-y-3 mb-6">
        {profile?.addresses?.map((address: Address) => (
          <div key={address.id} className="border border-gray-200 rounded-md p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                    {address.type}
                  </span>
                  {address.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-900">
                  {address.street}<br />
                  {address.city}, {address.state} {address.zipCode}<br />
                  {address.country}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => userService.setDefaultAddress(address.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Make Default
                </button>
                <button
                  onClick={() => userService.removeAddress(address.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        {profile?.addresses?.length === 0 && (
          <p className="text-gray-500 text-sm">No addresses added yet</p>
        )}
      </div>

      {/* Add Address Form */}
      {isAddingAddress && (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <h4 className="font-medium mb-4">Add New Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={newAddress.type}
                onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value as 'shipping' | 'billing' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="shipping">Shipping</option>
                <option value="billing">Billing</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                type="text"
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                value={newAddress.zipCode}
                onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={newAddress.country}
                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleAddAddress}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Address
            </button>
            <button
              onClick={() => setIsAddingAddress(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}