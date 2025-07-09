"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import adminApi from "../api/adminApi"
import { Users, Store, Star, Plus, LogOut, Shield, TrendingUp, BarChart3, Edit,Trello, Layout } from "lucide-react"
import authApi from "../api/authApi"

function AdminHome() {
  const { user, logout, updateProfileImage } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0,
  })
  
  // Image handling hooks - moved inside component
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Image handling functions - moved inside component
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!imageFile) return
    
    setUploading(true)
    try {
      const result = await authApi.uploadProfileImage({
        userId: user.id,
        imageBase64: imagePreview
      })
      
      // Update user context with new image URL
      updateProfileImage(result.imageUrl)
      
      // Reset state
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setUploading(false)
    }
  }
  
  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user || user.role !== "admin") {
      navigate("/login")
      return
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        // Get users count
        const users = await adminApi.getAllUsers()

        // Get stores count and total ratings
        const stores = await adminApi.getAllStores()

        // Calculate total ratings
        const totalRatings = stores.reduce((sum, store) => sum + store.ratingsCount, 0)

        setStats({
          totalUsers: users.length,
          totalStores: stores.length,
          totalRatings: totalRatings,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [user, navigate])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Shield className="w-14 h-14 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xl text-gray-600">Welcome back, {user.name}!</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
            >
              <LogOut className="w-8 h-8 mr-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Welcome Card with Profile Image */}
        <div className="bg-white rounded-xl shadow-lg p-12 mb-16 animate-fade-in">
          <div className="flex items-center space-x-8">
            <div className="relative">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile Preview" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
                />
              ) : user.profile_image_url ? (
                <img 
                  src={user.profile_image_url} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="w-16 h-16 text-white" />
                </div>
              )}
              
              {/* Image upload button */}
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">Welcome, {user.name}!</h2>
              <p className="text-xl text-gray-600">
                You are logged in as an <span className="font-medium text-purple-600">{user.role}</span>
              </p>
              
              {/* Show upload button if image is selected */}
              {imageFile && (
                <button
                  onClick={handleImageUpload}
                  disabled={uploading}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>Upload New Image</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-12 text-white animate-fade-in transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-medium text-blue-100 mb-4">Total Users</h3>
                <p className="text-5xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Users className="w-12 h-12" />
              </div>
            </div>
            <div className="mt-8 flex items-center text-blue-100">
              <TrendingUp className="w-8 h-8 mr-2" />
              <span className="text-lg">Active users in system</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-12 text-white animate-fade-in transform hover:scale-105 transition-all duration-300"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-medium text-green-100 mb-4">Total Companies</h3>
                <p className="text-5xl font-bold">{stats.totalStores}</p>
              </div>
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Store className="w-12 h-12" />
              </div>
            </div>
            <div className="mt-8 flex items-center text-green-100">
              <BarChart3 className="w-8 h-8 mr-2" />
              <span className="text-lg">Registered companies</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-12 text-white animate-fade-in transform hover:scale-105 transition-all duration-300"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-medium text-orange-100 mb-4">Total Ratings</h3>
                <p className="text-5xl font-bold">{stats.totalRatings}</p>
              </div>
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Star className="w-12 h-12" />
              </div>
            </div>
            <div className="mt-8 flex items-center text-orange-100">
              <Star className="w-8 h-8 mr-2" />
              <span className="text-lg">User reviews submitted</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-12 animate-fade-in">
          <div className="flex items-center space-x-6 mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-semibold text-gray-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            <Link
              to="/admin/users"
              className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-decoration-none"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
                <p className="text-gray-600 text-sm">View, edit, and manage all users in the system</p>
              </div>
            </Link>

            <Link
              to="/admin/stores"
              className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-decoration-none"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">View Companies</h3>
                <p className="text-gray-600 text-sm">Browse and manage all registered companies</p>
              </div>
            </Link>

            <Link
              to="/admin/users/new"
              className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-decoration-none"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add User</h3>
                <p className="text-gray-600 text-sm">Create new user accounts for the system</p>
              </div>
            </Link>
            
            {/* Add new Kanban board link */}
            <Link
              to="/boards"
              className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-decoration-none"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Trello className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Kanban Boards</h3>
                <p className="text-gray-600 text-sm">Manage tasks and projects with Kanban boards</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Additional Admin Info */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-12 text-white animate-fade-in">
          <div className="flex items-center space-x-8">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Shield className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Admin Privileges</h3>
              <p className="text-xl text-purple-100">
                You have full administrative access to manage users, companies, and system settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHome