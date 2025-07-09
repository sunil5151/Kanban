
"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import adminApi from "../api/adminApi"
import authApi from "../api/authApi"
import { Store, Star, Edit, Package, Users, Lock, LogOut, Eye, EyeOff, Plus, Mail, MapPin, X, Camera, Upload, Trello, Layout,FileText } from "lucide-react"

function ContractorHome() {
  const { user, logout, updateProfileImage } = useAuth()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [applicationUsers, setApplicationUsers] = useState([])
  const [loadingApplicationUsers, setLoadingApplicationUsers] = useState(false)
  const [showApplicationUsers, setShowApplicationUsers] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [expandedProposal, setExpandedProposal] = useState(null)
  
  // Add image upload state variables
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  // Add image handling functions
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
    // Redirect if not logged in or not a contractor
    if (!user || user.role !== "contractor" &&  user.role !== "store_owner" ) {  
      console.log("ContractorHome: User role check failed", user?.role)
      navigate("/login")
      return
    }

    // Fetch company data for this contractor
    const fetchCompanyData = async () => {
      try {
        const companyData = await adminApi.getStoreByOwnerId(user.id)
        setCompany(companyData)
      } catch (err) {
        console.error("Error fetching company:", err)
        setError(err.error || "Failed to load company data")
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [user, navigate])

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    try {
      await authApi.updatePassword({
        userId: user.id,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })

      setPasswordSuccess("Password updated successfully")
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
      })
    } catch (err) {
      setPasswordError(err.error || "Failed to update password")
    }
  }

  const fetchApplicationUsers = async () => {
    if (!company) return

    setLoadingApplicationUsers(true)
    try {
      const users = await adminApi.getStoreRatingUsers(company.id)
      setApplicationUsers(users)
      setShowApplicationUsers(true)
    } catch (err) {
      console.error("Error fetching application users:", err)
    } finally {
      setLoadingApplicationUsers(false)
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />)
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />)
      }
    }
    return stars
  }

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* Increased py-4 to py-8 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8"> {/* Increased space-x-4 to space-x-8 */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg"> {/* Increased w-12 h-12 to w-24 h-24 */}
                <Store className="w-14 h-14 text-white" /> {/* Increased w-7 h-7 to w-14 h-14 */}
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gray-900">Contractor Dashboard</h1> {/* Increased text-3xl to text-5xl */}
                <p className="text-xl text-gray-600">Welcome back, {user.name}!</p> {/* Added text-xl */}
              </div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
            > {/* Increased px-4 py-2 to px-8 py-4 and text-sm to text-lg */}
              <LogOut className="w-8 h-8 mr-4" /> {/* Increased w-4 h-4 mr-2 to w-8 h-8 mr-4 */}
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"> {/* Increased py-8 to py-16 */}
        {/* Welcome Card with Profile Image (New) */}
        <div className="bg-white rounded-xl shadow-lg p-12 mb-16 animate-fade-in"> {/* Increased p-6 mb-8 to p-12 mb-16 */}
          <div className="flex items-center space-x-8"> {/* Increased space-x-4 to space-x-8 */}
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
                  <Store className="w-16 h-16 text-white" />
                </div>
              )}
              
              {/* Image upload button */}
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
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
                You are logged in as a <span className="font-medium text-purple-600">{user.role}</span>
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

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-24 text-center animate-fade-in"> {/* Increased p-12 to p-24 */}
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-purple-600 mx-auto mb-8"></div> {/* Increased h-12 w-12 border-t-2 border-b-2 to h-24 w-24 border-t-4 border-b-4 and mb-4 to mb-8 */}
            <p className="text-xl text-gray-600">Loading company information...</p> {/* Added text-xl */}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-12 mb-16 animate-fade-in"> {/* Increased p-6 mb-8 to p-12 mb-16 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8"> {/* Increased w-16 h-16 mb-4 to w-32 h-32 mb-8 */}
                <Store className="w-16 h-16 text-red-600" /> {/* Increased w-8 h-8 to w-16 h-16 */}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Company Found</h3> {/* Increased text-lg mb-2 to text-2xl mb-4 */}
              <p className="text-xl text-red-600 mb-12">{error}</p> {/* Increased mb-6 to mb-12 and added text-xl */}
              <Link
                to="/owner/store/new"
                className="inline-flex items-center px-12 py-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              > {/* Increased px-6 py-3 to px-12 py-6 and added text-xl */}
                <Plus className="w-10 h-10 mr-4" /> {/* Increased w-5 h-5 mr-2 to w-10 h-10 mr-4 */}
                Create Your Company
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Company Information */}
            <div className="bg-white rounded-xl shadow-lg p-12 mb-16 animate-fade-in"> {/* Increased p-6 mb-8 to p-12 mb-16 */}
              <div className="flex items-center space-x-6 mb-12"> {/* Increased space-x-3 mb-6 to space-x-6 mb-12 */}
                <Store className="w-12 h-12 text-purple-600" /> {/* Increased w-6 h-6 to w-12 h-12 */}
                <h2 className="text-3xl font-semibold text-gray-900">Your Company</h2> {/* Increased text-xl to text-3xl */}
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-12 mb-12"> {/* Increased p-6 mb-6 to p-12 mb-12 */}
                <h3 className="text-4xl font-bold text-gray-900 mb-8">{company.name}</h3> {/* Increased text-2xl mb-4 to text-4xl mb-8 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"> {/* Increased gap-4 mb-6 to gap-8 mb-12 */}
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{company.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900">{company.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(Number.parseFloat(company.averageRating))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {Number.parseFloat(company.averageRating).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-gray-600">({company.ratingsCount} applications)</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/owner/store/edit"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Company
                  </Link>

                  <Link
                    to="/owner/store/items"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Manage Tenders
                  </Link>

                  <button
                    onClick={fetchApplicationUsers}
                    disabled={loadingApplicationUsers}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingApplicationUsers ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    View Application Users
                  </button>
                </div>
              </div>
            </div>

            {/* Application Users Section */}
            {showApplicationUsers && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-slide-down">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Users Who Applied to Your Company</h3>
                  </div>
                  <button
                    onClick={() => setShowApplicationUsers(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {applicationUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No applications yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Application</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Proposal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicationUsers.map((user, index) => (
                          <tr
                            key={user.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <td className="py-3 px-4 text-gray-900">{user.name}</td>
                            <td className="py-3 px-4 text-gray-600">{user.email}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">{renderStars(user.rating)}</div>
                                <span className="font-medium text-gray-900">{user.rating}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {user.proposal ? (
                                <div className="max-w-xs">
                                  <div className="relative">
                                    <div className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
                                      {user.proposal.length > 100 
                                        ? user.proposal.substring(0, 100) + "..." 
                                        : user.proposal}
                                    </div>
                                    {user.proposal.length > 100 && (
                                      <button 
                                        onClick={() => setExpandedProposal(expandedProposal === user.id ? null : user.id)}
                                        className="mt-1 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                      >
                                        {expandedProposal === user.id ? "Show Less" : "Show More"}
                                      </button>
                                    )}
                                  </div>
                                  {expandedProposal === user.id && (
                                    <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg absolute z-10 max-w-md">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-900">Full Proposal</h4>
                                        <button 
                                          onClick={() => setExpandedProposal(null)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <p className="text-gray-700 whitespace-pre-wrap">{user.proposal}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">No proposal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Password Update Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Update Password</h3>
              </div>

              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </button>
              ) : (
                <div className="animate-slide-down">
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 animate-shake">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 animate-fade-in">
                      {passwordSuccess}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={showOldPassword ? "text" : "password"}
                            name="oldPassword"
                            value={passwordForm.oldPassword}
                            onChange={handlePasswordChange}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                            placeholder="Enter new password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordError("")
                          setPasswordSuccess("")
                          setPasswordForm({ oldPassword: "", newPassword: "" })
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex space-x-3 mt-6">
        <Link
          to="/owner/store/new"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          <Edit className="w-4 h-4 mr-2 inline" />
          Edit Company
        </Link>
        <button
          onClick={() => setShowTenders(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
        >
          <FileText className="w-4 h-4 mr-2 inline" />
          Manage Tenders
        </button>
        <button
          onClick={() => setShowApplicationUsers(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          <Users className="w-4 h-4 mr-2 inline" />
          View Users
        </button>
        {/* Add new Kanban board link */}
        <Link
          to="/boards"
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
        >
          <Trello className="w-4 h-4 mr-2 inline" />
          Kanban Boards
        </Link>
      </div>
    </div>
  )
}

export default ContractorHome