document.addEventListener("DOMContentLoaded", function () {
   // Keep track of scroller states
   const scrollerStates = new Map();

   // Force all images to load eagerly, bypassing Squarespace lazy-loading
   function forceEagerImages(scroller) {
     const images = scroller.querySelectorAll("img");
     const promises = [];
     images.forEach((img) => {
       const url = img.dataset.src || img.dataset.image;
       if (url) {
         img.src = url;
       }
       img.loading = "eager";
       img.removeAttribute("data-loader");
       if (img.complete) return;
       promises.push(new Promise((resolve) => {
         img.addEventListener("load", resolve, { once: true });
         img.addEventListener("error", resolve, { once: true });
       }));
     });
     return Promise.all(promises);
   }

   function applyScrollProperties(scroller) {
     if (scroller) {
       // Get original items by filtering out duplicates we created
       const originalItems = Array.from(scroller.children).filter(
         (child) => !child.hasAttribute("aria-hidden")
       );

       // Check if there are any original items - if not, do nothing
       if (originalItems.length === 0) {
         // Reset animation-related attributes to prevent issues
         scroller.removeAttribute("data-scroller-scrolling");
         scrollerStates.delete(scroller);
         return;
       }

       // Calculate total width needed for one complete set
       const setWidth = originalItems.reduce((sum, item) => {
         const style = getComputedStyle(item);
         const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
         return sum + item.getBoundingClientRect().width + margin;
       }, 0);

       // Store set width as CSS variable for animation calculations
       scroller.style.setProperty("--scroller-set-width", setWidth);

       // Calculate sets needed based on container width
       const scrollerWidth = scroller.parentElement ? scroller.parentElement.getBoundingClientRect().width : 0;
       const totalSets = Math.max(1, Math.ceil(scrollerWidth / setWidth));
       const prevTotalSets = scrollerStates.get(scroller);

       // Skip DOM updates if number of sets hasn't changed
       if (prevTotalSets === totalSets) {
         return;
       }

       // Use DocumentFragment for efficient DOM manipulation
       const fragment = document.createDocumentFragment();

       // Add original items first
       originalItems.forEach(item => {
         fragment.appendChild(item);
       });

       // Add required number of duplicate sets
       for (let i = 0; i < totalSets; i++) {
         originalItems.forEach(item => {
           const duplicate = item.cloneNode(true);
           duplicate.setAttribute("aria-hidden", "true");
           fragment.appendChild(duplicate);
         });
       }

       // Update DOM in single operation
       scroller.innerHTML = "";
       scroller.appendChild(fragment);

       // Add initialization flag for CSS transitions
       if (!scroller.hasAttribute("data-scroller-scrolling")) {
         scroller.setAttribute("data-scroller-scrolling", "true");
       }
       scrollerStates.set(scroller, totalSets);
     }
   }

   // Initialize all scrollers found on the page
   async function initializeScrollers() {
     const scrollers = document.querySelectorAll('.user-items-list[data-space-below-section-title-value="91"] .user-items-list-simple');

     // If no scrollers found, don't set up resize listener
     if (!scrollers.length) {
       return null;
     }

     await Promise.all(Array.from(scrollers).map(scroller => forceEagerImages(scroller)));
     scrollers.forEach(scroller => {
       applyScrollProperties(scroller);
     });
     return scrollers;
   }

   // Debounce function to limit resize calculations
   function debounce(func, delay) {
     let timer;
     return (...args) => {
       clearTimeout(timer);
       timer = setTimeout(() => func(...args), delay);
     };
   }

   initializeScrollers().then(scrollers => {
     // Only add resize listener if scrollers exist
     if (scrollers) {
       const handleResize = debounce(() => {
         scrollers.forEach((scroller) => {
           applyScrollProperties(scroller);
         });
       }, 300);

       window.addEventListener("resize", handleResize);
     }
   });
});
