import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import zaplet from "../assets/zaplet.png";
import chatIcon from "../assets/chat-icon.png";

const HomePage: React.FC = () => {
  const [location, setLocation] = useState("Hyde Park");
  const [locations, setLocations] = useState<string[]>([]);
  const [budget, setBudget] = useState("£1000 - £2000");
  const [moveInDate, setMoveInDate] = useState("2024-09-08");
  const [individuals, setIndividuals] = useState("1 Adult");
  const [isLocationDropdownVisible, setIsLocationDropdownVisible] =
    useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (location && location !== "Hyde Park") {
      fetchLocations(location);
    }
  }, [location]);

  const fetchLocations = async (query: string) => {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY; // Retrieve API key from environment variables
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${apiKey}`
      );
      setLocations(
        response.data.features.map(
          (feature: any) => feature.properties.formatted
        )
      );
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !budget || !moveInDate || !individuals) {
      alert("Please fill in all fields before searching.");
      return;
    }
    const searchQuery = {
      location,
      budget,
      moveInDate,
      individuals,
    };
    localStorage.setItem("searchQuery", JSON.stringify(searchQuery));
    console.log("Search Query Saved:", searchQuery);
    navigate("/chat"); // Navigate to chat
  };

  return (
    <div className="bg-cover bg-center bg-no-repeat bg-fixed bg-home-bg text-white">
      <header className="bg-transparent bg-opacity-50 py-5">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={zaplet} alt="ZapLet ai Logo" className="h-12 mr-2" />
              <h2 className="inline text-xl ml-2 mt-[-2.5px]">Zaplet</h2>
            </div>
            <div className="block md:hidden cursor-pointer flex flex-col justify-between w-7 h-5">
              <div className="bg-white h-[3px] w-full transition-transform"></div>
              <div className="bg-white h-[3px] w-full mt-1"></div>
              <div className="bg-white h-[3px] w-full mt-1"></div>
            </div>
            <ul className="hidden md:flex space-x-5 items-center">
              <li>
                <Link to="/chat" className="text-white">
                  Ask Zaplet
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white">
                  Blog
                </Link>
              </li>
              <li>
                <button
                  className="bg-[#ff7f50] text-white py-3 px-6 rounded-md"
                  onClick={handleSearch}
                >
                  Discover!
                </button>
              </li>
            </ul>
          </nav>
          <div className="text-center mt-24">
            <h1 className="text-4xl mb-5">
              Hi, This is <span className="text-[#ff7f50]">Zaplet</span> your
              property finder in London
            </h1>
            <form
              className="flex flex-col md:flex-row justify-center gap-5 mt-8"
              id="search-form"
              onSubmit={handleSearch}
            >
              <div className="relative flex flex-col items-start">
                <label htmlFor="location" className="mb-1 text-sm">
                  Location
                </label>
                <input
                  type="text"
                  id="location-input"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setIsLocationDropdownVisible(true);
                  }}
                  className="p-2 rounded-md border-none w-52 text-black"
                  onBlur={
                    () =>
                      setTimeout(() => setIsLocationDropdownVisible(false), 200) // Adjusted delay
                  }
                />
                {isLocationDropdownVisible && locations.length > 0 && (
                  <ul className="absolute z-10 bg-white text-black w-52 border border-gray-300 rounded-md mt-14 max-h-60 overflow-auto">
                    {locations.map((loc, index) => (
                      <li
                        key={index}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          console.log("Selected location:", loc); // Debugging line
                          setLocation(loc);
                          setIsLocationDropdownVisible(false);
                        }}
                      >
                        {loc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col items-start">
                <label htmlFor="budget" className="mb-1 text-sm">
                  Preferred Budget
                </label>
                <select
                  id="budget-input"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="p-2 rounded-md border-none w-52 text-black"
                >
                  <option value="£1000 - £2000">£1000 - £2000</option>
                  <option value="£2000 - £3000">£2000 - £3000</option>
                  <option value="£3000 - £4000">£3000 - £4000</option>
                  <option value="£4000 - £5000">£4000 - £5000</option>
                </select>
              </div>
              <div className="flex flex-col items-start">
                <label htmlFor="movein-date" className="mb-1 text-sm">
                  Date to Move In
                </label>
                <input
                  type="date"
                  id="date-input"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="p-2 rounded-md border-none w-52 text-black"
                />
              </div>
              <div className="flex flex-col items-start">
                <label htmlFor="individuals" className="mb-1 text-sm">
                  No. of Individuals Living In
                </label>
                <select
                  id="individuals-input"
                  value={individuals}
                  onChange={(e) => setIndividuals(e.target.value)}
                  className="p-2 rounded-md border-none w-52 text-black"
                >
                  <option value="1 Adult">1 Adult</option>
                  <option value="2 Adults">2 Adults</option>
                  <option value="3 Adults">3 Adults</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#ff7f50] text-white py-0 px-9 pb-0 rounded-md text-lg mt-5 w-full md:w-auto"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </header>
      <section className="flex flex-wrap justify-around mt-9">
        <div className="bg-black bg-opacity-10 p-4 rounded-lg text-white flex flex-col justify-between w-80 h-52 mx-5 mb-5">
          <h3 className="text-lg mb-2">Suggestion</h3>
          <p className="flex-grow">
            I want to live near my friends. Show me homes for both of us in the
            same neighborhood.
          </p>
          <Link
            to="/chat"
            className="text-white font-bold hover:text-[#ff5733]"
          >
            I'm feeling lucky!
          </Link>
        </div>
        <div className="bg-black bg-opacity-10 p-4 rounded-lg text-white flex flex-col justify-between w-80 h-52 mx-5 mb-5">
          <h3 className="text-lg mb-2">Suggestion</h3>
          <p className="flex-grow">
            I'm a gym enthusiast, so find me properties with easy access to
            fitness facilities.
          </p>
          <Link
            to="/chat"
            className="text-white font-bold hover:text-[#ff5733]"
          >
            Discover Now!
          </Link>
        </div>
        <div className="bg-black bg-opacity-15 p-4 rounded-lg text-white flex flex-col justify-between w-80 h-52 mx-5 mb-5">
          <h3 className="text-lg mb-2">Looking for rentals</h3>
          <p className="flex-grow">
            List rental properties that match my budget and living preferences.
          </p>
          <Link
            to="/chat"
            className="text-white font-bold hover:text-[#ff5733]"
          >
            Check Listings!
          </Link>
        </div>
      </section>
      <footer className="flex justify-center items-center bg-black text-white py-3">
        <p className="text-center text-sm">
          © 2024 Zaplet. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
