import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { SaladOrder } from './pages/SaladOrder';
import { ShabbosBox } from './pages/ShabbosBox';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <img 
              src="/Screenshot_2025-03-11_at_22.35.00-removebg-preview.webp"
              alt="Simcha's Gourmet" 
              className="h-20 object-contain"
            />
            <nav className="flex gap-6">
              <Link 
                to="/" 
                className="text-lg font-semibold text-[#8B0000] hover:text-red-700 transition-colors"
              >
                Salad Time
              </Link>
              {/* Shabbos Box link removed as requested */}
            </nav>
            <div className="mt-2">
              <a 
                href="https://queensvaad.org/location/simchas-gourmet-catering/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img 
                  src="https://queensvaad.org/wp-content/themes/vhq/images/logo.png" 
                  alt="VAAD HARABONIM OF QUEENS" 
                  className="h-6 object-contain inline-block"
                />
              </a>
            </div>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<SaladOrder />} />
        <Route path="/shabbos-box" element={<ShabbosBox />} />
      </Routes>

      <footer className="bg-white shadow-lg mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-[#8B0000] mb-4">Kashrut</h3>
                <p className="text-gray-700">
                  Everything is Cholov Yisroel, Pas Yisroel, Yoshon and Chasidishe Shechita
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#8B0000] mb-4">Contact Us</h3>
                <address className="text-gray-700 not-italic">
                  <p className="mb-2">136-52 71st Road</p>
                  <p className="mb-2">Flushing Queens, New York 11367</p>
                  <p>
                    <a href="tel:718-683-4352" className="hover:text-[#8B0000] transition-colors">
                      718-683-4352
                    </a>
                  </p>
                </address>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;