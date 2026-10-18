"use client";

import { useState, type ReactNode } from "react";
import styles from "./homepage.module.css";

const images = ["/images/homepage-exam-room.png", "/images/homepage-reading.png", "/images/homepage-listening.png"];
export default function HomepageBanner({ children }: { children: ReactNode }) {
  const [slide, setSlide] = useState(0);
  const move = (offset: number) => setSlide((current) => (current + offset + images.length) % images.length);
  return <section className={styles.banner} aria-label="IELTS practice introduction" aria-roledescription="carousel">
    <img src={images[slide]} alt="" className={styles.bannerImage} />
    <div className={styles.container}><div className={styles.bannerPanel}>{children}</div></div>
    <div className={styles.dots} aria-label="Choose banner image">{images.map((_, index) => <button key={index} aria-label={`Show banner image ${index + 1}`} aria-pressed={slide === index} className={slide === index ? styles.activeDot : ""} onClick={() => setSlide(index)} />)}</div>
    <div className={styles.bannerControls}><button type="button" aria-label="Previous banner image" onClick={() => move(-1)}>&#8249;</button><button type="button" aria-label="Next banner image" onClick={() => move(1)}>&#8250;</button></div>
  </section>;
}
