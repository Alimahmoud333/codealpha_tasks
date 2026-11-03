import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { APP_NAME } from "../../constants/appConfig.js";
import APP_ROUTES from "../../constants/appRoutes.js";
import useAuth from "../../hooks/useAuth.js";
import useCart from "../../hooks/useCart.js";
import Button from "../common/Button.jsx";

export default function Navbar() {
  const { authenticated, isAdmin, user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to={APP_ROUTES.SHOP} className="navbar__brand" onClick={closeMenu}>
          {APP_NAME}
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>

        <nav id="main-navigation" className={`navbar__nav${menuOpen ? " navbar__nav--open" : ""}`} aria-label="Main">
          <ul className="navbar__links">
            <li>
              <NavLink to={APP_ROUTES.SHOP} onClick={closeMenu}>
                Shop
              </NavLink>
            </li>
            <li>
              <NavLink to={APP_ROUTES.COMMUNITY} onClick={closeMenu}>
                Community
              </NavLink>
            </li>
            {authenticated && (
              <li>
                <NavLink to={APP_ROUTES.ORDERS} end onClick={closeMenu}>
                  My orders
                </NavLink>
              </li>
            )}
            {isAdmin && (
              <li>
                <NavLink to={APP_ROUTES.ADMIN_PRODUCTS} onClick={closeMenu}>
                  Manage store
                </NavLink>
              </li>
            )}
          </ul>

          <ul className="navbar__actions">
            <li>
              <NavLink to={APP_ROUTES.CART} className="navbar__cart" onClick={closeMenu}>
                <ShoppingBag size={20} aria-hidden="true" />
                <span>Cart</span>
                {itemCount > 0 && (
                  <span className="navbar__cart-count" aria-label={`${itemCount} items in cart`}>
                    {itemCount}
                  </span>
                )}
              </NavLink>
            </li>
            {authenticated ? (
              <>
                <li>
                  <NavLink to={APP_ROUTES.ACCOUNT} onClick={closeMenu}>
                    {user.name}
                  </NavLink>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                  >
                    Log out
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to={APP_ROUTES.LOGIN} onClick={closeMenu}>
                    Log in
                  </NavLink>
                </li>
                <li>
                  <Link to={APP_ROUTES.REGISTER} className="btn btn--primary" onClick={closeMenu}>
                    Create account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
