export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  
  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/confirm']
  const isPublicRoute = publicRoutes.includes(to.path)
  
  // If user is authenticated and trying to access signin page, redirect to home
  if (user.value && to.path === '/signin') {
    return navigateTo('/')
  }
  
  // If user is not authenticated and trying to access protected route, redirect to signin
  if (!user.value && !isPublicRoute) {
    return navigateTo('/signin')
  }
})
