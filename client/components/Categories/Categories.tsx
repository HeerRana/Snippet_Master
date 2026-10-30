"use client";
import React, { useEffect } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { EmblaCarouselType } from "embla-carousel";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useUserContext } from "@/context/userContext";
import { usePathname } from "next/navigation";
import { useSnippetContext } from "@/context/snippetsContext";
import { ITag } from "@/types/types";
import { useGlobalContext } from "@/context/globalContext";

function Categories() {
  const {
    tags,
    getPublicSnippets,
    getUserSnippets,
    getLikedSnippets,
    getPopularSnippets,
  } = useSnippetContext();
  const userId = useUserContext().user?._id;
  const { isSidebarOpen } = useGlobalContext();

  const [activeTag, setActiveTag] = React.useState("All");
  const [activeTagId, setActiveTagId] = React.useState<string | null>(null);

  const pathname = usePathname();

  // tags rail: arrows scroll about one screenful of chips
  const [railApi, setRailApi] = React.useState<EmblaCarouselType>();
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(true);

  useEffect(() => {
    if (!railApi) return;
    const update = () => {
      setCanPrev(railApi.canScrollPrev());
      setCanNext(railApi.canScrollNext());
    };
    update();
    railApi.on("select", update).on("scroll", update).on("reInit", update);
    return () => {
      railApi.off("select", update).off("scroll", update).off("reInit", update);
    };
  }, [railApi]);

  const scrollRail = (direction: 1 | -1) => {
    if (!railApi) return;
    const step = Math.max(2, railApi.slidesInView().length - 1);
    const last = railApi.scrollSnapList().length - 1;
    const target = railApi.selectedScrollSnap() + direction * step;
    railApi.scrollTo(Math.max(0, Math.min(last, target)));
  };

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
    <div
      className="tag-strip bg-3 fixed right-0 z-10 transition-[left] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{ left: isSidebarOpen ? "15rem" : "5.2rem" }}
    >
      <div className="px-5 py-1.5">
        <div className="tag-rail bg-1 relative px-12 py-1 border border-rgba-2">
        <button
          type="button"
          aria-label="Scroll tags left"
          className="tag-arrow left-2"
          disabled={!canPrev}
          onClick={() => scrollRail(-1)}
        >
          <FaChevronLeft />
        </button>
        <button
          type="button"
          aria-label="Scroll tags right"
          className="tag-arrow right-2"
          disabled={!canNext}
          onClick={() => scrollRail(1)}
        >
          <FaChevronRight />
        </button>
        <Carousel
          className="w-full relative"
          setApi={setRailApi}
          opts={{ align: "start", dragFree: true, containScroll: "trimSnaps", duration: 32 }}
        >
          <CarouselContent className="flex gap-4">
            <CarouselItem
              className={`tag-chip relative px-4 py-1 text-[0.8rem] font-medium flex items-center justify-center rounded-full cursor-pointer select-none ${
                activeTag === "All" ? "tag-chip-active" : ""
              }`}
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
                  className={`tag-chip relative px-4 py-1 text-[0.8rem] font-medium flex items-center justify-center rounded-full cursor-pointer select-none ${
                  activeTag === tag.name ? "tag-chip-active" : ""
                }`}
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

        </Carousel>
        </div>
      </div>
    </div>
  );
}

export default Categories;
