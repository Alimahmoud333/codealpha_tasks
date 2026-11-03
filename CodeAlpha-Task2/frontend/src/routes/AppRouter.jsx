import { Navigate, Route, Routes } from "react-router-dom";
import APP_ROUTES from "../constants/appRoutes.js";
import AdminLayout from "../layouts/AdminLayout.jsx";
import CommunityLayout from "../layouts/CommunityLayout.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage.jsx";
import AdminProductsPage from "../pages/admin/AdminProductsPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import CartPage from "../pages/ecommerce/CartPage.jsx";
import CheckoutPage from "../pages/ecommerce/CheckoutPage.jsx";
import OrderConfirmationPage from "../pages/ecommerce/OrderConfirmationPage.jsx";
import OrderDetailsPage from "../pages/ecommerce/OrderDetailsPage.jsx";
import OrdersPage from "../pages/ecommerce/OrdersPage.jsx";
import ProductDetailsPage from "../pages/ecommerce/ProductDetailsPage.jsx";
import ProductsPage from "../pages/ecommerce/ProductsPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import FeedPage from "../pages/social/FeedPage.jsx";
import PeoplePage from "../pages/social/PeoplePage.jsx";
import PostPage from "../pages/social/PostPage.jsx";
import ProfilePage from "../pages/social/ProfilePage.jsx";
import AccountPage from "../pages/profile/AccountPage.jsx";
import AdminRoute from "./AdminRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={APP_ROUTES.HOME} element={<Navigate to={APP_ROUTES.SHOP} replace />} />

        {/* Public */}
        <Route path={APP_ROUTES.SHOP} element={<ProductsPage />} />
        <Route path={APP_ROUTES.PRODUCT_DETAILS} element={<ProductDetailsPage />} />

        {/* Visitors only */}
        <Route element={<GuestRoute />}>
          <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* Logged-in users */}
        <Route element={<ProtectedRoute />}>
          <Route path={APP_ROUTES.CART} element={<CartPage />} />
          <Route path={APP_ROUTES.CHECKOUT} element={<CheckoutPage />} />
          <Route path={APP_ROUTES.ORDERS} element={<OrdersPage />} />
          <Route path={APP_ROUTES.ORDER_CONFIRMATION} element={<OrderConfirmationPage />} />
          <Route path={APP_ROUTES.ORDER_DETAILS} element={<OrderDetailsPage />} />
          <Route path={APP_ROUTES.ACCOUNT} element={<AccountPage />} />

          {/* Task 2: community (shares the same login) */}
          <Route element={<CommunityLayout />}>
            <Route path={APP_ROUTES.COMMUNITY} element={<FeedPage />} />
            <Route path={APP_ROUTES.POST_DETAILS} element={<PostPage />} />
            <Route path={APP_ROUTES.PEOPLE} element={<PeoplePage />} />
            <Route path={APP_ROUTES.PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Administrators */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path={APP_ROUTES.ADMIN_PRODUCTS} element={<AdminProductsPage />} />
            <Route path={APP_ROUTES.ADMIN_ORDERS} element={<AdminOrdersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
