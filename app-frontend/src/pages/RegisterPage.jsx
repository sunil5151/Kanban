"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import authApi from "../api/authApi"
import { validateForm } from "../utils/validators"
import { useAuth } from "../context/AuthContext"
import { Eye, EyeOff, User, Mail, MapPin, Lock, UserCheck } from "lucide-react"

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
    role: "user", // Default role is user and cannot be changed
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateForm(formData, ["name", "email", "address", "password", "role"])
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      // Convert role to lowercase and trim any whitespace before sending to API
      const submissionData = {
        ...formData,
        role: formData.role.toLowerCase().trim()
      }
      const userData = await authApi.registerUser(submissionData)
      login(userData)

      // Redirect based on role
      switch (userData.role) {
        case "admin":
          navigate("/admin")
          break
        case "contractor":
          navigate("/owner")
          break
        default:
          navigate("/user")
      }
    } catch (error) {
      console.error("Registration error:", error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        setErrors({ general: error.error || "Registration failed" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mb-4 transform hover:scale-110 transition-transform duration-300">
              <div className="w-6 h-6 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join us to get unlimited access to data & information.</p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-shake">
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${errors.name ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>20-60 characters required</span>
                <span className={formData.name.length > 60 ? "text-red-500" : ""}>{formData.name.length}/60</span>
              </div>
              {errors.name && <p className="text-red-500 text-sm animate-slide-down">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${errors.email ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm animate-slide-down">{errors.email}</p>}
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none ${errors.address ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                  placeholder="Enter your full address"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Maximum 400 characters</span>
                <span className={formData.address.length > 400 ? "text-red-500" : ""}>
                  {formData.address.length}/400
                </span>
              </div>
              {errors.address && <p className="text-red-500 text-sm animate-slide-down">{errors.address}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${errors.password ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">8-16 characters, at least one uppercase and one special character</p>
              {errors.password && <p className="text-red-500 text-sm animate-slide-down">{errors.password}</p>}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white ${errors.role ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                >
                  <option value="user">User</option>

                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.role && <p className="text-red-500 text-sm animate-slide-down">{errors.role}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl"}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Geometric Pattern */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          {/* Large Circles */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-400 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-blue-300 rounded-full opacity-30 animate-float-delayed"></div>
          <div className="absolute bottom-32 left-16 w-40 h-40 bg-teal-400 rounded-full opacity-15 animate-float"></div>

          {/* Geometric Shapes */}
          <div className="absolute top-32 right-20 w-16 h-16 bg-yellow-400 transform rotate-45 animate-pulse"></div>
          <div className="absolute bottom-40 right-40 w-12 h-12 bg-orange-400 rounded-full animate-bounce-slow"></div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-4 p-8">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-sm animate-pulse"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "3s",
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-lg transform rotate-12 animate-spin-slow"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-300 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4 animate-fade-in-up">Join Our Community</h2>
            <p className="text-xl opacity-90 animate-fade-in-up-delayed">
              Discover amazing features and connect with like-minded people
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage