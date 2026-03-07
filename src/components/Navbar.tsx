import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Music, Menu, X, User, ShoppingBag, Sparkles, LogOut, Settings, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const navLinks = [
  { to: "/", labelKey: "nav.marketplace", icon: ShoppingBag },
  { to: "/my-songs", labelKey: "nav.mySongs", icon: Music, requiresAuth: true },
  { to: "/custom-request", labelKey: "nav.customRequest", icon: Sparkles, requiresAuth: true },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-lg text-gradient">
              Raag Bazaar
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              // Skip auth-required links if not logged in
              if (link.requiresAuth && !user) return null;

              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-primary/20 neon-border rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <link.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{t(link.labelKey)}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              title={t('nav.language')}
            >
              <Languages className="w-4 h-4" />
              {i18n.language === 'en' ? 'हिं' : 'EN'}
            </button>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
                  <User className="w-4 h-4" />
                  {user.name}
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-all neon-border flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {t('nav.login')}
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-border/50"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {/* Language Toggle - Mobile */}
              <button
                onClick={() => {
                  toggleLanguage();
                  setIsOpen(false);
                }}
                className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-3"
              >
                <Languages className="w-4 h-4" />
                {t('nav.language')}: {i18n.language === 'en' ? 'हिंदी' : 'English'}
              </button>

              {navLinks.map((link) => {
                // Skip auth-required links if not logged in
                if (link.requiresAuth && !user) return null;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
                      location.pathname === link.to
                        ? "bg-primary/20 text-primary neon-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {t(link.labelKey)}
                  </Link>
                );
              })}

              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" />
                      {t('nav.admin')}
                    </Link>
                  )}
                  <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border/50 mt-2">
                    Signed in as {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-lg text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all flex items-center gap-3 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium bg-primary/20 text-primary neon-border flex items-center gap-3"
                >
                  <User className="w-4 h-4" />
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
