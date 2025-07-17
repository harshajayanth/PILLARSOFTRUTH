import { Button } from "@/components/ui/button";

export default function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[90%] max-w-md relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

        {/* ✅ Logo in center */}
        <img
          src="/images/logo.png"
          alt="Pillars of Truth Logo"
          className="w-24 h-24 mx-auto mb-4"
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder.png";
          }}
        />

        {/* ✅ Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          About Pillars of Truth
        </h2>

        {/* ✅ Community Info */}
        <p className="text-gray-600 leading-relaxed">
          <strong>Pillars of Truth</strong> is a faith-based Youth community
          dedicated to spreading the message of hope, love, and truth through
          engaging sessions, meaningful discussions, and outreach programs.
          <br />
          <br />
          We welcome everyone to join us in building a stronger spiritual
          foundation together as one family.
        </p>

        {/* ✅ Buttons / Links */}
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={onClose} className="bg-primary text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
