"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import authApi from "../api/authApi"
import { validateForm } from "../utils/validators"
import { useAuth } from "../context/AuthContext"
import { Eye, EyeOff, Mail, Lock, Crown } from "lucide-react"
import "./styles/auth.css" // New CSS file for auth pages

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    const validationErrors = validateForm(formData, ["email", "password"])
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const userData = await authApi.loginUser(formData)
      
      // Debug information
      console.log("Login response:", userData)
      console.log("User role:", userData.role)
      console.log("Role type:", typeof userData.role)
      
      login(userData)

      // Redirect based on role
      switch (userData.role) {
        case "admin":
          navigate("/admin")
          break
        case "contractor":
          navigate("/owner")
          break
        case "store_owner": // Add this case to handle store_owner role
          console.log("Detected store_owner role, redirecting to /owner")
          navigate("/owner")
          break
        default:
          console.log("Using default redirection for role:", userData.role)
          navigate("/user")
      }
    } catch (error) {
      console.error("Login error:", error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        setErrors({ general: error.error || "Login failed" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Left Side - Login Form */}
      <div className="auth-form-container">
        <div className="auth-form-content">
          {/* Logo */}
          <div className="auth-header">
            <div className="auth-logo">
              <Crown className="auth-logo-icon" />
            </div>
            <h1 className="auth-title">Welcome back!</h1>
            <p className="auth-subtitle">Enter to get unlimited access to data & information.</p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="auth-error">
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email <span className="required-mark">*</span>
              </label>
              <div className="input-container">
                
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? "input-error" : ""}`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required-mark">*</span>
              </label>
              <div className="input-container">
               
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? "input-error" : ""}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-footer">
              <div className="remember-me">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="checkbox"
                />
                <label htmlFor="remember-me" className="checkbox-label">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="forgot-password">
                Forgot your password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`submit-button ${isSubmitting ? "button-disabled" : ""}`}
            >
              {isSubmitting ? (
                <div className="button-loading">
                  <div className="loading-spinner"></div>
                  Logging in...
                </div>
              ) : (
                "Log In"
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <span className="divider-text">Or, Login with</span>
            </div>

            {/* Register Link */}
            <div className="auth-link-container">
              <p className="auth-link-text">
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Removed */}
    </div>
  )
}

export default LoginPage
