import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";

type Person = {
  id: string;
  name: string;
  role: string;
  image: string;
  email: string;
  bio: string;
};

const people = [
  {
    id: "1",
    name: "Bobby Albert M",
    role: "Preacher",
    image: "/images/bobby.jpeg",
    email: "burmacoc@gmail.com",
    bio: "Church Of Christ, Kakinada",
  },
  {
    id: "2",
    name: "Sukesh Raja M",
    role: "Preacher",
    image: "/images/sukesh.png",
    email: "cocrcpm@gmail.com",
    bio: "Church Of Christ, Ramachandrapuram",
  },
  {
    id: "3",
    name: "Raja S",
    role: "Youth Minister",
    image: "/images/raja.png",
    email: "sunny.coc94@gmail.com",
    bio: "Church Of Christ, Kakinada",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function Parent() {
  const [selected, setSelected] = useState<Person | null>(null);
  const { user } = useAuth();

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Meet Our Supporters
        </h2>

        <motion.div
          className="flex space-x-6 flex-wrap justify-center overflow-x-auto pb-4 no-scrollbar"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {people.map((person) => (
            <motion.div
              key={person.id}
              variants={cardVariants}
              onClick={() => {
                if (user?.isAuthenticated) {
                  setSelected(person);
                }
              }}
              className="cursor-pointer flex-none w-40 text-center"
            >
              <img
                src={person.image}
                alt={person.name}
                onError={(e) => {
                  e.currentTarget.src = "/images/person.png"; // fallback image
                }}
                className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-blue-100 hover:border-blue-500 transition"
              />
              <h3 className="mt-2 text-lg font-semibold">{person.name}</h3>
              <p className="text-sm text-gray-500">{person.role}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full p-6 relative shadow-xl"
              >
                <button
                  className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                  onClick={() => setSelected(null)}
                >
                  &times;
                </button>
                <div className="text-center">
                  <img
                    src={selected.image}
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-blue-200"
                    onError={(e) => {
                      e.currentTarget.src = "/images/person.png"; // fallback image
                    }}
                    alt={selected.name}
                  />
                  <h3 className="text-xl font-semibold">{selected.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{selected.role}</p>
                  <p className="text-gray-700 text-sm mb-4">{selected.bio}</p>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selected.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    Message
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
