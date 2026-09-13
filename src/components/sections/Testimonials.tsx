import React from "react";
import { TESTIMONIALS } from "@/lib/data";
import TestimonialCard from "@/components/ui/TestimonialCard";

export default function Testimonials() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        {/* H2 Title */}
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-primary tracking-tight mb-8 md:mb-10">
          What Our Customers Say
        </h2>

        {/* 3 Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
