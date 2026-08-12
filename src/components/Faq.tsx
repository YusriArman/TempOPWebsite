import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import bgProp from "../assets/logo.webp";
import HomeHeader from "./home/header";
import { faqList } from "./faq/faq";
import Footer from "./home/footer";

const Faq: React.FC = () => {
  return (
    <>
      <div className="bg-gradient-to-b from-celestialSecondary to-celestialPrimary h-screen text-slate-50 relative overflow-x-hidden">
        <div className="absolute bottom-0 right-[-300px] opacity-50 ">
          <img src={bgProp} alt="background planet" className="h-72 sm:h-96" />
        </div>

        <HomeHeader />
        <div className="p-6 mx-4 sm:mx-8 flex flex-col space-y-4">
          <h1 className="text-4xl font-zendots">FAQ</h1>
          <Accordion type="multiple" className="z-10 font-alata">
            {faqList.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-xl font-semibold text-left">
                  {index + 1}. {faq.title}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.desc.map((desc, idx) => (
                    <p
                      key={idx}
                      className="mb-2 text-celestialLightGray text-lg"
                    >
                      {desc}
                    </p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Faq;
