"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, MapPin, CalendarDays } from "lucide-react";
import { useSavedStore } from "@/store/useSavedStore";
import { useChatStore } from "@/store/useChatStore";
import { appendEulReul } from "@/utils/korean";

interface FestivalData {
  festival_id: string | number;
  name: string;
  location: string;
  image_url: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

// SVG Back Arrow Icon
const BackArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// SVG Share Icon
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 10L12.5 13.3333M12.5 6.66667L7.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="13.3333" cy="5.83333" r="1.66667" stroke="white" strokeWidth="1.5" />
    <circle cx="6.66667" cy="10" r="1.66667" stroke="white" strokeWidth="1.5" />
    <circle cx="13.3333" cy="14.1667" r="1.66667" stroke="white" strokeWidth="1.5" />
  </svg>
);

const CourseUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16V8M12 8L8 12M12 8L16 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function FestivalDetail() {
  const params = useParams();
  const router = useRouter();
  const festivalId = params.id as string;
  const [activeTab, setActiveTab] = useState("info");

  const [festival, setFestival] = useState<FestivalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleItem = useSavedStore((state) => state.toggleItem);
  const savedItems = useSavedStore((state) => state.savedItems);
  const isSaved = (id: string) => savedItems.some((item) => item.id === id);
  const loadSavedItems = useSavedStore((state) => state.loadSavedItems);
  const clearChat = useChatStore((state) => state.clearChat);
  const sendMessage = useChatStore((state) => state.sendMessage);

  useEffect(() => {
    loadSavedItems();
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';
    
    fetch(`${API_BASE_URL}/api/festivals/${festivalId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Festival API failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data?.status === "success" && data.data) {
          const fData = data.data;
          setFestival({
            ...fData,
            description: fData.description || "해당 축제에 대한 소개가 없습니다.",
            image_url: fData.image_url?.startsWith('http') ? fData.image_url : `${API_BASE_URL}${fData.image_url || ''}`
          });
        } else {
          console.warn(`Festival ${festivalId} not found`);
        }
      })
      .catch(err => {
        console.error("Failed to load festival data:", err);
      })
      .finally(() => setIsLoading(false));
  }, [festivalId, loadSavedItems]);

  // Close the tab
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      window.close();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">불러오는 중...</div>;
  }

  if (!festival) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">축제 정보를 찾을 수 없습니다.</p>
        <button onClick={handleBack} className="px-4 py-2 bg-brand-red text-white rounded-lg">돌아가기</button>
      </div>
    );
  }

  const dateDisplay = festival.start_date 
    ? (festival.end_date ? `${formatDate(festival.start_date)} ~ ${formatDate(festival.end_date)}` : formatDate(festival.start_date))
    : "일정 미정";

  return (
    <div className="relative min-h-screen bg-white pb-24 overflow-x-hidden flex flex-col w-full">
      {/* 1. Top Image & Top Buttons */}
      <div className="relative w-full h-[316px] bg-[#D9D9D9] flex-shrink-0">
        <img
          src={festival.image_url}
          alt={festival.name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Top bar layer */}
        <div className="absolute top-[36px] sm:top-[56px] px-5 w-full flex justify-between items-center z-10">
          <button
            onClick={handleBack}
            className="w-[40px] h-[40px] bg-[#2C2C2C]/60 shadow-md rounded-full flex justify-center items-center backdrop-blur-sm"
          >
            <BackArrowIcon />
          </button>

          <div className="flex gap-3">
            <button className="w-[40px] h-[40px] bg-[#2C2C2C]/60 shadow-md rounded-full flex justify-center items-center backdrop-blur-sm">
              <ShareIcon />
            </button>
            <button
              onClick={() => toggleItem({
                id: `festival-${festival.festival_id}`,
                type: 'festival',
                name: festival.name,
                location: festival.location,
                image_url: festival.image_url
              })}
              className="w-[40px] h-[40px] bg-[#2C2C2C]/60 shadow-md rounded-full flex justify-center items-center backdrop-blur-sm transition-transform active:scale-95"
            >
              <Heart className={`w-[24px] h-[24px] ${isSaved(`festival-${festival.festival_id}`) ? "text-[#FA5252] fill-[#FA5252]" : "text-white"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. White Container Content */}
      <div className="relative -mt-6 bg-white w-full flex-1 rounded-t-3xl pt-8 px-5 z-20 flex flex-col">

        {/* Badges */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center px-2.5 py-1.5 bg-[#FFF0F0] rounded-[3px]">
            <span className="text-[10px] font-bold font-sans text-[#FA5252]">지역축제</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[24px] font-bold font-sans text-black leading-[1.3] mb-3 pr-2 break-keep">
          {festival.name}
        </h1>

        {/* Location Icon & Address */}
        <div className="flex items-start gap-1.5 mb-4">
          <MapPin className="w-[20px] h-[20px] text-[#FA5252] mt-0.5 flex-shrink-0" />
          <span className="text-[14px] font-medium font-sans text-[#656565] leading-relaxed">
            {festival.location}
          </span>
        </div>

        {/* Tabs & Divider */}
        <div className="relative w-full mb-8 flex border-b border-[#E8E7E2]">
          {[
            { id: "info", label: "정보" },
            { id: "reviews", label: "리뷰" },
            { id: "photos", label: "사진" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 text-center pb-3 transition-colors"
            >
              <span className={`text-[14px] font-semibold font-sans tracking-[-0.05em] ${activeTab === tab.id
                  ? "bg-gradient-to-b from-[#FB5B57] to-[#FE876F] text-transparent bg-clip-text"
                  : "text-[#BDBDBD]"
                }`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
               <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[#FA5252]" />
              )}
            </button>
          ))}
        </div>

        {/* Content Details */}
        <div className="w-full flex-1 mb-[90px]">
          {activeTab === "info" && (
            <>
              <h3 className="text-[14px] font-bold font-sans tracking-[-0.05em] text-black mb-3 text-left">
                소개
              </h3>
              <p className="text-[13px] font-medium font-sans leading-[1.6] text-[#A2A2A2] text-left mb-8 break-keep">
                {festival.description}
              </p>

              <h3 className="text-[14px] font-bold font-sans tracking-[-0.05em] text-black mb-3 text-left">
                진행 기간
              </h3>
              <div className="flex items-start gap-1.5 text-[#626262] mb-8">
                <CalendarDays className="w-[14px] h-[14px] flex-shrink-0 mt-[2px]" />
                <p className="text-[13px] font-medium font-sans leading-[1.6] text-left break-keep text-[#FA5252]">
                  {dateDisplay}
                </p>
              </div>

              {/* Action Button */}
              <div className="w-full mt-8 pb-[30px] flex justify-center z-30">
                <div className="w-full pointer-events-auto">
                  <button
                    onClick={() => {
                      clearChat();
                      if (festival.name) {
                        sendMessage(`${appendEulReul(festival.name)} 일정으로 코스를 짜줘`);
                      }
                      router.push('/chat');
                    }}
                    className="w-full h-[52px] rounded-[15px] bg-gradient-to-r from-[#FA5654] to-[#FF8970] flex justify-center items-center gap-[13px] transition-transform active:scale-95 shadow-lg shadow-[#FA5654]/20"
                  >
                    <CourseUpIcon />
                    <span className="text-[16px] font-extrabold font-sans text-white">
                      이걸로 코스 짜기
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "reviews" && (
            <div className="flex justify-center items-center py-16">
              <p className="text-[14px] font-medium text-[#A2A2A2]">현재 작성된 리뷰가 없습니다.</p>
            </div>
          )}

          {activeTab === "photos" && (
            <div className="flex justify-center items-center py-16">
              <p className="text-[14px] font-medium text-[#A2A2A2]">현재 등록된 사진이 없습니다.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
