import { Outlet } from 'react-router-dom'
import AppNav from './AppNav'

export default function Layout() {
  return (
    <>
      <AppNav />
      <Outlet />
    </>
  )
}
