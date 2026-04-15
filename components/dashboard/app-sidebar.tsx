'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  Package,
  CreditCard,
  FileText,
  Settings,
  Leaf,
  UserCircle,
} from 'lucide-react'

interface AppSidebarProps {
  user: User
  profile: Profile | null
}

const mainNavItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Farmers',
    url: '/dashboard/farmers',
    icon: Users,
  },
  {
    title: 'Buyers',
    url: '/dashboard/buyers',
    icon: ShoppingCart,
  },
]

const operationsNavItems = [
  {
    title: 'Arrivals',
    url: '/dashboard/arrivals',
    icon: Truck,
  },
  {
    title: 'Sales',
    url: '/dashboard/sales',
    icon: Package,
  },
  {
    title: 'Payments',
    url: '/dashboard/payments',
    icon: CreditCard,
  },
]

const reportsNavItems = [
  {
    title: 'Billing',
    url: '/dashboard/billing',
    icon: FileText,
  },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: FileText,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
]

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Leaf className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Mandi Manager</span>
                  <span className="text-xs text-sidebar-foreground/70">Business Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Reports & Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <UserCircle className="size-5" />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">{profile?.full_name || 'User'}</span>
                <span className="text-xs capitalize text-sidebar-foreground/70">{profile?.role || 'Staff'}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
