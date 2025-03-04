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
  }, [location])

  // const handleLogout = async () => {
  //   await logout()
  //   navigate('/login')
  // }

  const handlePageChange = (page: string) => {
    setActivePage(page)
  }

  return (
    <div className="flex flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activePage={activePage} onPageChange={handlePageChange} />
        <div className='flex-1'>
        <Outlet />
        </div>
         
      
     
    </div>
  )
}