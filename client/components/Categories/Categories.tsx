"use client";
import React, { useEffect } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useUserContext } from "@/context/userContext";
import { usePathname } from "next/navigation";
import { useSnippetContext } from "@/context/snippetsContext";
import { ITag } from "@/types/types";

function Categories() {
  const {
    tags,
    getPublicSnippets,
    getUserSnippets,
    getLikedSnippets,
    getPopularSnippets,
  } = useSnippetContext();
  const userId = useUserContext().user?._id;

  const [activeTag, setActiveTag] = React.useState("All");
  const [activeTagId, setActiveTagId] = React.useState<string | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    const fetchData = async () => {
      // if a tag is selected, filter snippets by tag
      if (activeTagId) {
        switch (pathname) {
          case "/":
            await getPublicSnippets("", activeTagId);
            break;
          case "/snippets":
            await getUserSnippets(activeTagId);
            break;
          case "/favourites":
            await getLikedSnippets(activeTagId);
            break;
          case "/popular":
            await getPopularSnippets(activeTagId);
            break;
          default:
            break;
        }
      } else {
        // id no tag is selected, get all snippets
        await getPublicSnippets();
        await getPopularSnippets();

        if (userId) {
          await getUserSnippets();
          await getLikedSnippets();
        }
      }
    };

    fetchData();
  }, [pathname, userId, activeTagId]);

  return (
    <div className="fixed w-full z-10">
      <div className="pl-14 pr-[16rem] py-5 bg-3 border-b-2 border-rgba-2">
        <Carousel className="w-full lg:max-w-[1100px] xl:max-w-[1300px] relative">
          <CarouselContent className="flex gap-4">
            <CarouselItem
              className={`relative px-6 py-1 rounded-full cursor-pointer border-[0.1rem] border-rgba-1 select-none
                ${
                  activeTag === "All"
                    ? "text-white bg-[#7263F3]"
                    : "bg-[#3A3B3C] text-white hover:text-gray-800 hover:bg-white transition-all duration-300 ease-in-out"
                }
                `}
              onClick={() => {
                setActiveTag("All");
                setActiveTagId(null);
                getPublicSnippets();
              }}
            >
              All
            </CarouselItem>
            {tags.map((tag: ITag) => {
              return (
                <CarouselItem
                  key={tag._id}
                  className={`relative px-6 py-1 text-sm flex items-center rounded-full cursor-pointer border-[0.1rem] border-rgba-1 select-none
                ${
                  activeTag === tag.name
                    ? "text-white bg-[#7263F3]"
                    : "bg-[#3A3B3C] text-white hover:text-gray-800 hover:bg-white transition-all duration-300 ease-in-out"
                }
                `}
                  onClick={() => {
                    setActiveTag(tag.name);
                    setActiveTagId(tag._id);
                  }}
                >
                  {tag.name.toUpperCase()}
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20" />
          <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20" />
        </Carousel>
      </div>
    </div>
  );
}

export default Categories;
