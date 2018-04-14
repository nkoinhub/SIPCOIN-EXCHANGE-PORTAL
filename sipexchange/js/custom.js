/*

Template: COINEX - Crypto Currency HTML Template 
Author: iqonicthemes.in
Version: 1.0
Design and Developed by: iqonicthemes.in

*/

/*================================================
[  Table of contents  ]
================================================

:: Page loader
:: Back to top
:: search
:: Charts
:: Header
:: wow
:: jarallax
:: counter
:: Progress Bar
:: countdown
:: owl carousel
:: Magnific Popup
::widget

======================================
[ End table content ]
======================================*/

"use strict";

/*************************
    Page loader
*************************/
function preloader() {
    $("#load").fadeOut();
    $('#loading').delay().fadeOut();

}

/*************************
  Back to top
*************************/
function backtotop() {
    $('#back-to-top').fadeOut();
    $(window).scroll(function() {
        if ($(this).scrollTop() > 250) {
            $('#back-to-top').fadeIn(1500);
        } else {
            $('#back-to-top').fadeOut(500);
        }
    });
    // scroll body to 0px on click
    $('#top').on('click', function() {
        $('top').tooltip('hide');
        $('body,html').animate({
            scrollTop: 0
        }, 800);
        return false;
    });
}

/*************************
search
*************************/

function search() {
    // search 2
    $(".iq-search").on('click', function() {
        $(".search-open").fadeIn(500);
    });
    $(".search-close").on('click', function() {
        $(".search-open").fadeOut(500);
    });
    // search-2
    if (jQuery('.iq-search').size() > 0) {
        jQuery('.search-btn').on("click", function() {
            jQuery('.iq-search').toggleClass("search-open");
            return false;
        });
        jQuery("html, body").on('click', function(e) {
            if (!jQuery(e.target).hasClass("not-click")) {
                jQuery('.iq-search').removeClass("search-open");
            }
        });
    }

}

/*************************
          Charts
*************************/
function charts() {
    (function(b, i, t, C, O, I, N) {
        window.addEventListener('load', function() {
            if (b.getElementById(C)) return;
            I = b.createElement(i), N = b.getElementsByTagName(i)[0];
            I.src = t;
            I.id = C;
            N.parentNode.insertBefore(I, N);
        }, false)

    });

}

/*************************
Header
*************************/
function header() {
    $(window).on('scroll', function() {
        if ($(this).scrollTop() > 20) {
            $('header').addClass('menu-sticky');
        } else {
            $('header').removeClass('menu-sticky');
        }
    });
    var touch = $('#resp-menu');
    var menu = $('.menu');

    $(touch).on('click', function(e) {
        e.preventDefault();
        menu.slideToggle();
    });

    $(window).resize(function() {
        var w = $(window).width();
        if (w > 767 && menu.is(':hidden')) {
            menu.removeAttr('style');
        }
    });
}

/*************************
wow
*************************/
function wow() {
    new WOW().init();

}


/*************************
jarallax
*************************/
function jarallax() {
    $('.jarallax').jarallax({
        speed: 0.2
    });

}

/*************************
       counter
*************************/
function counter() {
    $('.timer').countTo();
}



/*************************
Progress Bar
*************************/
function progress() {
    $('.iq-progress-bar > span').each(function() {
        var $this = $(this);
        var width = $(this).data('percent');
        $this.css({
            'transition': 'width 2s'
        });
        setTimeout(function() {
            $this.appear(function() {
                $this.css('width', width + '%');
            });
        }, 500);
    });
}

/*************************
       countdown
*************************/
function countdown() {
    $('#countdown').countdown({
        date: '10/01/2018 23:59:59',
        offset: -8,
        day: 'Day',
        days: 'Days'
    });
}

/*************************
       owl carousel 
*************************/
function owlcarousel() {
    $(".owl-carousel").each(function() {
        var $this = $(this),
            $items = ($this.data('items')) ? $this.data('items') : 1,
            $loop = ($this.data('loop')) ? $this.data('loop') : true,
            $navdots = ($this.data('nav-dots')) ? $this.data('nav-dots') : false,
            $navarrow = ($this.data('nav-arrow')) ? $this.data('nav-arrow') : false,
            $autoplay = ($this.attr('data-autoplay')) ? $this.data('autoplay') : true,
            $space = ($this.attr('data-space')) ? $this.data('space') : 30;
        $(this).owlCarousel({
            loop: $loop,
            items: $items,
            responsive: {
                0: {
                    items: $this.data('xx-items') ? $this.data('xx-items') : 1
                },
                600: {
                    items: $this.data('xs-items') ? $this.data('xs-items') : 1
                },
                767: {
                    items: $this.data('sm-items') ? $this.data('sm-items') : 2
                },
                992: {
                    items: $this.data('md-items') ? $this.data('md-items') : 2
                },
                1190: {
                    items: $this.data('lg-items') ? $this.data('lg-items') : 3
                },
                1200: {
                    items: $items
                }
            },
            dots: $navdots,
            margin: $space,
            nav: $navarrow,
            navText: ["<i class='ion-ios-arrow-left'></i>", "<i class='ion-ios-arrow-right'></i>"],
            autoplay: $autoplay,
            autoplayHoverPause: true
        });

    });

}

/*************************
Magnific Popup
*************************/
function popupgallery() {
    $('.popup-gallery').magnificPopup({
        delegate: 'a.popup-img',
        type: 'image',
        tLoading: 'Loading image #%nnn%...',
        mainClass: 'mfp-img-mobile',
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1]
        },
        image: {
            tError: '<a href="%url%">#%nnn%</a>',
        }
    });

    $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
        disableOn: 700,
        type: 'iframe',
        mainClass: 'mfp-fade',
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false
    });

}


/*************************
widget
*************************/
function widget() {
    $('.iq-widget-menu > ul > li > a').on('click', function(){
        var checkElement = $(this).next();
        $('.iq-widget-menu li').removeClass('active');
        $(this).closest('li').addClass('active');
        if ((checkElement.is('ul')) && (checkElement.is(':visible'))) {
            $(this).closest('li').removeClass('active');
            checkElement.slideUp('normal');
        }
        if ((checkElement.is('ul')) && (!checkElement.is(':visible'))) {
            $('.iq-widget-menu ul ul:visible').slideUp('normal');
            checkElement.slideDown('normal');
        }
        if ($(this).closest('li').find('ul').children().length === 0) {
            return true;
        } else {
            return false;
        }
    });
}


$(document).ready(function() {
    owlcarousel(),
        backtotop(),
        wow(),
        header(),
        counter(),
        progress(),
        jarallax(),
        charts(),
        search(),
        countdown(),
        popupgallery(),
        widget(),
        preloader();
});

$(window).on('load', function() {

});