   function toggleMobile(){
      const menu = document.querySelector('.menu');
      if(menu.style.display === 'flex') menu.style.display='none'; else menu.style.display='flex';
      menu.style.flexDirection = 'column';
      menu.style.background = 'rgba(2,6,12,0.6)';
      menu.style.padding = '12px';
      menu.style.position = 'absolute';
      menu.style.right = '20px';
      menu.style.top = '70px';
      menu.style.borderRadius = '10px';
    }

    // Simple slider
    (function(){
      const slides = document.getElementById('slides');
      const slidesCount = slides.children.length;
      const dotsWrap = document.getElementById('dots');
      let index = 0;
      for(let i=0;i<slidesCount;i++){
        const d = document.createElement('div'); d.className='dot' + (i===0? ' active':''); d.dataset.i = i;
        d.addEventListener('click', ()=>{goTo(+d.dataset.i)});
        dotsWrap.appendChild(d);
      }
      function goTo(i){ index = i; slides.style.transform = `translateX(${-100*i}%)`; updateDots(); }
      function updateDots(){ Array.from(dotsWrap.children).forEach((d,ii)=> d.classList.toggle('active', ii===index)); }
      function next(){ goTo((index+1)%slidesCount); }
      let t = setInterval(next, 5000);
      // pause on hover
      const slider = document.querySelector('.slider');
      slider.addEventListener('mouseenter', ()=> clearInterval(t));
      slider.addEventListener('mouseleave', ()=> t = setInterval(next,5000));
    })();

    // Contact form submission (front-end stub)
    function handleSubmit(e){
      e.preventDefault();
      const form = e.target;
      const data = Object.fromEntries(new FormData(form).entries());
      // replace with real endpoint (AJAX / integration) when ready
      alert('Thank you, ' + (data.name || '') + '! Your message has been prepared to send.\n(Replace this stub with your backend endpoint.)');
      form.reset();
    }

    // Footer year
    document.getElementById('year').textContent = new Date().getFullYear();
   
  // Simple horizontal auto-scroll
  const slider = document.querySelector('.slider-wrapper');
  let scrollStep = 1;
  function autoScroll() {
    if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) {
      scrollStep = -1;
    } else if (slider.scrollLeft <= 0) {
      scrollStep = 1;
    }
    slider.scrollLeft += scrollStep * 2;
  }
  let auto = setInterval(autoScroll, 30);
  slider.addEventListener('mouseenter', () => clearInterval(auto));
  slider.addEventListener('mouseleave', () => (auto = setInterval(autoScroll, 30)));



  document.addEventListener("DOMContentLoaded", () => {
    const members = document.querySelectorAll(".team-member");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, { threshold: 0.3 });

    members.forEach(member => {
      member.style.opacity = 0;
      member.style.transform = "translateY(20px)";
      observer.observe(member);
    });
  });


  // Counter animation when visible
  document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".counter");
    const options = { threshold: 0.5 };

    const startCount = (counter) => {
      const target = +counter.getAttribute("data-target");
      let count = 0;
      const increment = target / 100; // speed factor

      const update = () => {
        count += increment;
        if (count < target) {
          counter.textContent = Math.ceil(count);
          requestAnimationFrame(update);
        } else {
          counter.textContent = target + "+";
        }
      };
      update();
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, options);

    counters.forEach(counter => observer.observe(counter));
  });
