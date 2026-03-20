import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/context/auth'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/layout/RequireAuth'

import HomePage from '@/pages/Home'

const SearchPage = React.lazy(() => import('@/pages/Search'))
const DetailPage = React.lazy(() => import('@/pages/Detail'))
const MapPage = React.lazy(() => import('@/pages/Map'))
const PlannerPage = React.lazy(() => import('@/pages/Planner'))
const SavedPage = React.lazy(() => import('@/pages/Saved'))
const AuthPage = React.lazy(() => import('@/pages/Auth'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <React.Suspense
            fallback={
              <div className="container-app py-16 text-center text-muted-foreground">
                Loading…
              </div>
            }
          >
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/place/:title" element={<DetailPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route
                  path="/planner"
                  element={
                    <RequireAuth>
                      <PlannerPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <RequireAuth>
                      <SavedPage />
                    </RequireAuth>
                  }
                />
                <Route path="/auth" element={<AuthPage />} />
              </Route>
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
