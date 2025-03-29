import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useState, useEffect } from 'react'

export const Layout = () => {
  const location = useLocation()
  const [activePage, setActivePage] = useState('Dashboard')

  useEffect(() => {
    const path = location.pathname
    if (path.includes('dashboard')) setActivePage('Dashboard')
    else if (path.includes('employees')) setActivePage('Employees')
    else if (path.includes('leaves')) setActivePage('Leaves')
    else if (path.includes('payroll')) setActivePage('Payroll')
    else if (path.includes('employee/')) setActivePage('Employees') // Handle employee detail page
  }, [location])

  const handlePageChange = (page: string) => {
    setActivePage(page)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Fixed sidebar */}
      <Sidebar activePage={activePage} onPageChange={handlePageChange} />
      
      {/* Scrollable main content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}