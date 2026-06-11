"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { useSavedStore } from "@/store/useSavedStore";
import { useChatStore } from "@/store/useChatStore";

import { normalizeTags } from "@/utils/tagGrouper";
import { appendEulReul } from "@/utils/korean";

interface PlaceData {
  place_id: string | number;
  name: string;
  location: string;
  image_url: string;
  media_source?: string;
  type?: string;
  rating?: number;
  reviews_count?: number;
  description?: string;
  hours?: string;
  tags?: string[] | string;
  category?: string;
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

const MovieIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4Z" stroke="#FA5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 4V20" stroke="#FA5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 4V20" stroke="#FA5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 8H7M3 12H7M3 16H7M17 8H21M17 12H21M17 16H21" stroke="#FA5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CourseUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16V8M12 8L8 12M12 8L16 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PlaceDetail() {
  const params = useParams();
  const router = useRouter();
  const placeId = params.id as string;
  const [activeTab, setActiveTab] = useState("info");

  const [place, setPlace] = useState<PlaceData | null>(null);
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

    Promise.all([
      fetch(`${API_BASE_URL}/api/places/filter`).then(res => {
        if (!res.ok) throw new Error(`Filter API failed: ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/places/trends`).then(res => {
        if (!res.ok) throw new Error(`Trends API failed: ${res.status}`);
        return res.json();
      })
    ])
      .then(([filterData, trendsData]) => {
        let allPlaces: PlaceData[] = [];
        if (filterData?.status === "success" && filterData.data?.places) {
          allPlaces = [...filterData.data.places];
        }

        if (trendsData?.status === "success" && trendsData.data?.places) {
          trendsData.data.places.forEach((tp: any) => {
            const idx = allPlaces.findIndex(p => String(p.place_id) === String(tp.place_id));
            if (idx !== -1) {
              allPlaces[idx] = { ...allPlaces[idx], ...tp };
            } else {
              allPlaces.push(tp);
            }
          });
        }

        const foundPlace = allPlaces.find(p => String(p.place_id) === String(placeId));
        if (foundPlace) {
          const calculatePseudoRandomRating = (idStr: string) => {
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) {
              hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
            }
            hash = Math.abs(hash);
            const randomValue = (hash % 21) / 10; // 0.0 ~ 2.0
            return Number((3.0 + randomValue).toFixed(1)); // 3.0 ~ 5.0
          };

          const calculatePseudoRandomReviews = (idStr: string) => {
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) {
              hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
            }
            return 100 + (Math.abs(hash) % 900);
          };

          setPlace({
            ...foundPlace,
            type: foundPlace.category === 'TREND' ? '핫플' : (foundPlace.category === 'HIDDEN' ? '숨은명소' : '명소'),
            rating: calculatePseudoRandomRating(String(placeId)),
            reviews_count: calculatePseudoRandomReviews(String(placeId)),
            description: foundPlace.description || "해당 장소에 대한 소개가 없습니다.",
            hours: "매일 09:00 - 21:00",
            media_source: foundPlace.media_source || "미디어 명소",
            image_url: foundPlace.image_url?.startsWith('http') ? foundPlace.image_url : `${API_BASE_URL}${foundPlace.image_url || ''}`
          });
        } else {
          console.warn(`Place ${placeId} not found in filter or trends data`);
        }
      })
      .catch(err => {
        console.error("Failed to load place data:", err);
      })
      .finally(() => setIsLoading(false));
  }, [placeId, loadSavedItems]);

  // Close the tab
  const handleBack = () => {
    // If it was opened in a new tab, window.close() might work.
    // If not, it falls back to router.back().
    if (window.history.length > 1) {
      router.back();
    } else {
      window.close();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">불러오는 중...</div>;
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">장소 정보를 찾을 수 없습니다.</p>
        <button onClick={handleBack} className="px-4 py-2 bg-brand-red text-white rounded-lg">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white pb-24 overflow-x-hidden flex flex-col w-full">
      {/* 1. Top Image & Top Buttons */}
      <div className="relative w-full h-[316px] bg-[#D9D9D9] flex-shrink-0">
        <img
          src={place.image_url}
          alt={place.name}
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
                id: `place-${place.place_id}`,
                type: 'place',
                name: place.name,
                location: place.location,
                image_url: place.image_url
              })}
              className="w-[40px] h-[40px] bg-[#2C2C2C]/60 shadow-md rounded-full flex justify-center items-center backdrop-blur-sm transition-transform active:scale-95"
            >
              <Heart className={`w-[24px] h-[24px] ${isSaved(`place-${place.place_id}`) ? "text-[#FA5252] fill-[#FA5252]" : "text-white"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. White Container Content */}
      <div className="relative -mt-6 bg-white w-full flex-1 rounded-t-3xl pt-8 px-5 z-20 flex flex-col">

        {/* Badges */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFF0F0] rounded-[3px]">
            <MovieIcon />
            <span className="text-[10px] font-bold font-sans text-[#FA5252]">{place.media_source}</span>
          </div>

          <div className="flex items-center px-2.5 py-1.5 bg-[#F5F4F0] rounded-[3px]">
            <span className="text-[10px] font-bold font-sans text-[#8F8484]">{place.type}</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[24px] font-bold font-sans text-black leading-[1.3] mb-3 pr-2 break-keep">
          {place.name}
        </h1>

        {/* Location Icon & Address */}
        <div className="flex items-start gap-1.5 mb-4">
          <MapPin className="w-[20px] h-[20px] text-[#FA5252] mt-0.5 flex-shrink-0" />
          <span className="text-[14px] font-medium font-sans text-[#656565] leading-relaxed">
            {place.location}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2.5 mb-8">
          <span className="text-[16px] font-semibold font-sans text-[#FA5252]">{place.rating}</span>
          <div className="flex gap-[2px]">
            {[1, 2, 3, 4, 5].map((star) => {
              const rating = place.rating || 0;
              let fillPercent = 0;
              if (rating >= star) {
                fillPercent = 100;
              } else if (rating >= star - 1) {
                fillPercent = (rating - (star - 1)) * 100;
              }

              return (
                <div key={star} className="relative w-[14px] h-[14px]">
                  {/* Empty star background */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0">
                    <path d="M7 0L9.16667 4.58333L14 5.25L10.5 8.66667L11.3333 13.4167L7 11L2.66667 13.4167L3.5 8.66667L0 5.25L4.83333 4.58333L7 0Z" fill="#D9D9D9" />
                  </svg>
                  {/* Filled star foreground */}
                  <div className="absolute top-0 left-0 overflow-hidden h-full" style={{ width: `${fillPercent}%` }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 0L9.16667 4.58333L14 5.25L10.5 8.66667L11.3333 13.4167L7 11L2.66667 13.4167L3.5 8.66667L0 5.25L4.83333 4.58333L7 0Z" fill="#FA5252" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[14px] font-bold font-sans text-[#B8B8B8] tracking-[-0.05em] ml-2">
            리뷰 0개
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
                {place.description}
              </p>

              <h3 className="text-[14px] font-bold font-sans tracking-[-0.05em] text-black mb-3 text-left">
                운영시간
              </h3>
              <div className="flex items-start gap-1.5 text-[#626262] mb-8">
                <Clock className="w-[14px] h-[14px] flex-shrink-0 mt-[2px]" />
                <p className="text-[13px] font-medium font-sans leading-[1.6] text-left break-keep">
                  {place.hours}
                </p>
              </div>

              {place.tags && place.tags.length > 0 && (
                <>
                  <h3 className="text-[14px] font-bold font-sans tracking-[-0.05em] text-black mb-3 text-left">
                    태그
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {normalizeTags(place.tags).map((tag: string, index: number) => (
                      <span key={index} className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-[#FA5252] rounded-xl text-[12px] font-bold tracking-tight">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Action Button */}
              <div className="w-full mt-8 pb-[30px] flex justify-center z-30">
                <div className="w-full pointer-events-auto">
                  <button
                    onClick={() => {
                      clearChat();
                      if (place.name) {
                        sendMessage(`${appendEulReul(place.name)} 포함해서 코스를 짜줘`);
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
