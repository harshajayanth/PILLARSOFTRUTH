import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Mic, BookOpen, Play, Download, Eye } from "lucide-react";
import { SessionContent } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import  AuthModal  from '@/components/auth-modal';


export default function ContentLibrary() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'recordings' | 'chapters'>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);


  const { data: content, isLoading, error } = useQuery({
    queryKey: ['/api/content'],
    enabled: !!user?.isAuthenticated,
  });

  const handlePlayRecording = (recording: SessionContent) => {
    if (!user?.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access recordings",
        variant: "destructive"
      });
      return;
    }
    
    // Open recording in new tab or trigger download
    window.open(recording.fileUrl, '_blank');
  };

  const handleViewChapter = (chapter: SessionContent) => {
    if (!user?.isAuthenticated) {
      toast({
        title: "Authentication Required", 
        description: "Please sign in to access chapter notes",
        variant: "destructive"
      });
      return;
    }
    
    // Open chapter in new tab
    window.open(chapter.fileUrl, '_blank');
  };

  const filteredContent = content?.filter((item: SessionContent) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'recordings') return item.type === 'recording';
    if (activeFilter === 'chapters') return item.type === 'chapter';
    return true;
  }) || [];

  if (!user?.isAuthenticated) {
    return (
      <section id="recordings" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Recordings & Study Materials</h2>
            <p className="text-xl text-gray-600 mb-8">Please sign in to access our comprehensive library of teachings and resources</p>
            <Button onClick={() => setShowModal(true)} className="bg-primary text-white">
              Sign In to Access Content
            </Button>
          </div>
        </div>
        <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </section>
    );
  }

  return (
    <section id="recordings" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Recordings & Study Materials</h2>
          <p className="text-xl text-gray-600">Access our comprehensive library of teachings and resources</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveFilter('all')}
              className={activeFilter === 'all' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}
            >
              All Content
            </Button>
            <Button
              variant={activeFilter === 'recordings' ? 'default' : 'ghost'}
              onClick={() => setActiveFilter('recordings')}
              className={activeFilter === 'recordings' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}
            >
              Recordings
            </Button>
            <Button
              variant={activeFilter === 'chapters' ? 'default' : 'ghost'}
              onClick={() => setActiveFilter('chapters')}
              className={activeFilter === 'chapters' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}
            >
              Chapter Notes
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            <p>Failed to load content. Please try again later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item: SessionContent) => (
              <Card key={item.id} className="card-hover bg-white shadow-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      item.type === 'recording' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {item.type === 'recording' ? <Mic className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">Session {item.title}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{item.duration || item.pages}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => item.type === 'recording' ? handlePlayRecording(item) : handleViewChapter(item)}
                      className={`flex-1 transition-colors ${
                        item.type === 'recording'
                          ? 'bg-primary hover:bg-blue-700'
                          : 'bg-secondary hover:bg-purple-700'
                      } text-white`}
                    >
                      {item.type === 'recording' ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => window.open(item.fileUrl, '_blank')}
                      variant="outline"
                      className="bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredContent.length === 0 && !isLoading && (
          <div className="text-center text-gray-600">
            <p>No content available for the selected filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
