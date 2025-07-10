import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Flame, Crown } from "lucide-react";

const sessions = [
  {
    id: 1,
    title: "Session 1: Foundation",
    description: "Building strong foundations in faith and understanding",
    icon: Sprout,
    chapters: 12,
    recordings: 8,
    bgGradient: "from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    iconBg: "bg-primary",
    buttonColor: "bg-primary hover:bg-blue-700"
  },
  {
    id: 2,
    title: "Session 2: Growth",
    description: "Deepening spiritual maturity and leadership",
    icon: Flame,
    chapters: 15,
    recordings: 10,
    bgGradient: "from-purple-50 to-purple-100",
    borderColor: "border-purple-200",
    iconBg: "bg-secondary",
    buttonColor: "bg-secondary hover:bg-purple-700"
  },
  {
    id: 3,
    title: "Session 3: Ministry",
    description: "Preparing for active ministry and service",
    icon: Crown,
    chapters: 18,
    recordings: 12,
    bgGradient: "from-amber-50 to-amber-100",
    borderColor: "border-amber-200",
    iconBg: "bg-accent",
    buttonColor: "bg-accent hover:bg-yellow-500 text-gray-900"
  }
];

export default function SessionsOverview() {
  const scrollToRecordings = () => {
    const element = document.getElementById('recordings');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="sessions" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Annual Sessions</h2>
          <p className="text-xl text-gray-600">Three powerful sessions throughout the year, each filled with God's wisdom</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {sessions.map((session) => {
            const IconComponent = session.icon;
            return (
              <Card 
                key={session.id}
                className={`card-hover bg-gradient-to-br ${session.bgGradient} ${session.borderColor} border`}
              >
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className={`${session.iconBg} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{session.title}</h3>
                    <p className="text-gray-600 mb-6">{session.description}</p>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      <div className="flex items-center justify-between">
                        <span>Chapters:</span>
                        <span className="bg-primary text-white px-2 py-1 rounded">{session.chapters}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Recordings:</span>
                        <span className="bg-secondary text-white px-2 py-1 rounded">{session.recordings}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={scrollToRecordings}
                      className={`w-full ${session.buttonColor} transition-colors`}
                    >
                      View Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
