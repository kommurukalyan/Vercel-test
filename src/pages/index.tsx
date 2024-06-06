import Carousel from 'nuka-carousel';
import { useState } from 'react';

import PageBase from '@/components/layout/PageBase';
import LoginDetails from '@/components/pages/Login/login';

function Home() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userMsg, setUserMsg] = useState<string>('');

  const nextSlide = () => setCurrentIndex((prev) => prev + 1);
  const forceChangePasswordSlide = () => setCurrentIndex(2);
  const forgotPasswordSlide = () => setCurrentIndex(3);
  return (
    <PageBase>
      <Carousel
        slideIndex={currentIndex}
        dragging={false}
        swiping={false}
        withoutControls
      >
        <LoginDetails
          next={nextSlide}
          setUserEmail={setUserEmail}
          forceChangePasswordSlide={forceChangePasswordSlide}
          forgotPasswordSlide={forgotPasswordSlide}
          setUserMsg={setUserMsg}
        />
      </Carousel>
    </PageBase>
  );
}
export default Home;
