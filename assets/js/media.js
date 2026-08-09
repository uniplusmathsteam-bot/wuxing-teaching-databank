(function () {
  "use strict";

  const escapeHtml = function (value) {
    return window.WuxingMarkdown
      ? window.WuxingMarkdown.escape(value)
      : String(value ?? "").replace(/[&<>"']/g, "");
  };

  function sanitizeId(value) {
    return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
  }

  function getEmbedUrl(video, autoplay) {
    if (!video) return "";
    const id = sanitizeId(video.id);
    const auto = autoplay ? "1" : "0";

    if (video.provider === "youtube") {
      return "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=" + auto + "&rel=0";
    }

    if (video.provider === "vimeo") {
      return "https://player.vimeo.com/video/" + id + "?autoplay=" + auto + "&dnt=1&title=0&byline=0&portrait=0";
    }

    return "";
  }

  function getProviderLabel(video) {
    if (!video) return "Video";
    if (video.provider === "local") return "Local video";
    return video.provider === "youtube" ? "YouTube" : "Vimeo";
  }

  function renderLocalVideo(video, cover, title) {
    if (!video.src) return "";
    return [
      '<div class="media-frame">',
      '  <video class="video-embed" controls playsinline preload="metadata"',
      '    poster="' + escapeHtml(cover) + '"',
      '    aria-label="' + escapeHtml(title) + '">',
      '    <source src="' + escapeHtml(video.src) + '" type="video/mp4">',
      "    你的瀏覽器不支援 HTML5 影片播放。",
      "  </video>",
      "</div>"
    ].join("");
  }

  function renderVideo(video, cover, title) {
    if (video && video.provider === "local") {
      return renderLocalVideo(video, cover, title);
    }
    if (!video || !getEmbedUrl(video, false)) return "";
    return [
      '<div class="media-frame" data-video-frame>',
      '  <button class="video-poster" type="button"',
      '    data-video-provider="' + escapeHtml(video.provider) + '"',
      '    data-video-id="' + escapeHtml(video.id) + '"',
      '    aria-label="播放影片：' + escapeHtml(title) + '">',
      '    <img src="' + escapeHtml(cover) + '" alt="" loading="eager">',
      '    <span class="play-button" aria-hidden="true">▶</span>',
      "  </button>",
      "</div>"
    ].join("");
  }

  function renderImageGallery(images, layout) {
    if (!Array.isArray(images) || !images.length) return "";
    const buttons = images
      .map(function (image) {
        return [
          '<button type="button" data-lightbox-src="' + escapeHtml(image.src) + '"',
          ' data-lightbox-alt="' + escapeHtml(image.alt || "") + '">',
          '<img src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt || "") + '" loading="lazy">',
          "</button>"
        ].join("");
      })
      .join("");
    const layoutClass = layout === "document" ? " is-document" : "";
    return '<div class="image-gallery' + layoutClass + '" aria-label="圖片集">' + buttons + "</div>";
  }

  function activateVideo(button) {
    const provider = button.dataset.videoProvider;
    const id = button.dataset.videoId;
    const url = getEmbedUrl({ provider: provider, id: id }, true);
    if (!url) return;

    const iframe = document.createElement("iframe");
    iframe.className = "video-embed";
    iframe.src = url;
    iframe.title = button.getAttribute("aria-label").replace(/^播放影片：/, "");
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    button.replaceWith(iframe);
  }

  function openLightbox(source, alt) {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    const image = lightbox.querySelector("img");
    const caption = lightbox.querySelector("p");
    image.src = source;
    image.alt = alt || "";
    caption.textContent = alt || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".lightbox-close").focus();
  }

  function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    lightbox.querySelector("img").src = "";
  }

  function init() {
    document.addEventListener("click", function (event) {
      const videoButton = event.target.closest("[data-video-provider]");
      if (videoButton) {
        activateVideo(videoButton);
        return;
      }

      const imageButton = event.target.closest("[data-lightbox-src]");
      if (imageButton) {
        openLightbox(imageButton.dataset.lightboxSrc, imageButton.dataset.lightboxAlt);
        return;
      }

      if (event.target.closest(".lightbox-close") || event.target.id === "lightbox") {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLightbox();
    });
  }

  window.WuxingMedia = {
    init: init,
    video: renderVideo,
    images: renderImageGallery,
    embedUrl: getEmbedUrl,
    providerLabel: getProviderLabel
  };
})();
