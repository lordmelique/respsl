// global object that holds all slider parameters
mk_controller = {};

/*
 * Initialization Function, initializes all necessary params for slider
 */
mk_controller.init = function(settings){
	//settinng slider settings for this instance
	this.settings =  settings;
	this.responsiveParams = {};
	this.autoplayInterval = 'off';
	this.slider  = jQuery('#mk-container-'+this.settings.sliderId);
	this.currentSlide = parseInt(this.settings.startingSlide);
	
	//add some properties to dom elements based on settings
	this.setProperties();

	//add pagination
	if(this.settings.enablePagination == true){
		this.slider.find('.mk-pagination').removeClass('mk-disabled');
		this.bindPaginationEvents();
	}
	//add navigation buttons
	if(this.settings.enableNavigationButtons == true){
		this.slider.find('.mk-navigation-buttons').removeClass('mk-disabled');
		this.bindNavigationEvents();
	}
	//enable loop functionality
	if(this.settings.enableLoop == true){
		this.enableLoop();
	}

	//enable drag event
	if(this.settings.enableDragEvent == true){
		this.dragEventObject('dragSlider');
	}

	//enable autoplay
	if(this.settings.enableAutoPlay == true){
		this.startAutoPlaying();
	}

	//enable stop autolay on hover event
	if(this.settings.stopAutoPlayOnHover == true){
		this.stopAutoPlayOnHoverEvent();
	}

	//enabling navigation hover event
	if(this.settings.showNavigationButtonsOnHover == true){
		this.enableNavigationHoverEvent();
	}

	//adding before videos play button
	this.addPlayButtons();


	switch(this.settings.disableResponsive){
		case true:{
			//set all slide properties and go to currentSlide
			var newSlideProperties =  mk_controller.calculateSlideProperties();
			mk_controller.applySlideProperites( newSlideProperties );
			mk_controller.calculateSlidePositions();
			this.goToSlide(this.currentSlide,'instantly');
			break;
		}
		default:{
			//binging responsive events
			this.startResponsive();
			break;
		}
	}
}



/*
 * Calculates some screen based css properties for slides
 */
mk_controller.calculateSlideProperties = function(){
	var sliderInnerContainer = this.slider.find(' .mk-container-inner'),
		properties = {},
		sliderWidth = sliderInnerContainer.width();

	//setting each slide width
	properties['width'] = sliderWidth + 'px';

	//storing current width in responsive parametes object
	this.responsiveParams.slideWidth = sliderWidth;
	//returning calculated properties
	return properties;	
}
/*
 * Seta all slides the same 'properties' css object
 */
mk_controller.applySlideProperites = function(properties){
	var slider = this.slider.find(' .mk-container-inner');
	var slides = slider.find('.mk-slide-wrapper .mk-slide');
	
	//applying properties
	slides.each(function(){
		jQuery( this ).css( properties );
	});
}
/*
 * Scales size of the slider gently
 */
mk_controller.startResponsive = function(){
	var slider               = this.slider,
		sliderInnerContainer = this.slider.find(' .mk-container-inner'),
		resolution           = parseFloat(this.settings['height'])/parseFloat(this.settings['width']),
		settings             = this.settings,
		cstThis              = this,
		newSlideProperties;

	jQuery(window).on('resize',function(){
		var currentSlide = cstThis.currentSlide;
		//updating inner slider container size
		sliderInnerContainer.width( slider.width() );
		sliderInnerContainer.height( slider.width()*resolution );
		//if slider is too bigger then its settings value apply settings value
		if(sliderInnerContainer.width() > parseFloat(settings['width'])){
			sliderInnerContainer.width( parseFloat(settings['width']) );
			sliderInnerContainer.height( parseFloat(settings['width'])*resolution );
		}
		//updating all slides 
		newSlideProperties =  mk_controller.calculateSlideProperties();
		mk_controller.applySlideProperites( newSlideProperties );
		mk_controller.calculateSlidePositions();

		//update video element sizes if there are any
		mk_controller.updateVideoSizes();
		//each time go to current slide for dinamic change of translate property
		mk_controller.goToSlide(currentSlide,'instantly');
	});

	//triggering resize for proper fit
	//why trigger 2 times? BUG fix when triggered once slider doesn't fit properly
	jQuery(window).trigger('resize');
	jQuery(window).trigger('resize');
}

/*
 * Calculates each slide position for proper slide changeing
 * Saves slide positions in this.slidePositions array
 */
mk_controller.calculateSlidePositions = function(){
	this.slidePositions = [];
	var slideWidth          = this.responsiveParams.slideWidth,
		lengthRelative      = 0,
		i,
		tmpPosition = {};
	for( i = 0 ; i < this.settings.slidesCount; i++ ){
		tmpPosition = {
			'slide' : i,
			'transform' : 'translate3d(-'+i*slideWidth+'px,0,0)',
			'coord' : -i*slideWidth
		};
		this.slidePositions.push(tmpPosition);
	}
}
/*
 * Sets propertes form this.settins to dom elemetns
 */
 mk_controller.setProperties = function(){
 	var slider = this.slider;
 	slider.find('.mk-slide-wrapper').css({
 		'-webkit-transition-property' : 'transform',
 		'-webkit-transition-timing-function' : this.settings.transitionFunction,
 		'-webkit-transition-duration' : this.settings.transitionTime+'ms', 
 		'transition-property' : 'transform',
 		'transition-timing-function' : this.settings.transitionFunction,
 		'transition-duration' : this.settings.transitionTime+'ms'
 	});
 }


/*
 * Goes to given slide
 */
 mk_controller.goToSlide = function(slideNumber,type){
 	var slideWrapper = this.slider.find('.mk-slide-wrapper'),
 		settings      = this.settings,
 		playBtn  = this.slider.find('#mk-nav-play');
 	switch(type){
 		case 'instantly':{
 			//removing transition time
 			slideWrapper.css('transition-duration','0ms');
 			slideWrapper.css('-webkit-transition-duration','0ms');
 			//going to slide
 			slideWrapper.css('transform',this.slidePositions[slideNumber - 1].transform);
 			//setting back transition
 			slideWrapper.one('transitionEnd webkitTransitionEnd',function(){
 				slideWrapper.css('transition-duration',settings.transitionTime+'ms');
 				slideWrapper.css('-webkit-transition-duration',settings.transitionTime+'ms');
 			});
 			setTimeout(function(){
 				slideWrapper.css('transition-duration',settings.transitionTime+'ms');
 				slideWrapper.css('-webkit-transition-duration',settings.transitionTime+'ms');
 			},10);
 			break;
 		}
 		default:{
 			slideWrapper.css('transform',this.slidePositions[slideNumber - 1].transform);
 			break;
 		}
 	}
 	this.currentSlide = slideNumber;

 	
 	//if pagination is enabled then change active pagiantion
 	if(settings.enablePagination == true){
 		this.slider.find('.mk-pagination .mk-pagination-active').removeClass('mk-pagination-active');
 		this.slider.find('.mk-pagination .mk-pagination-item').eq(this.currentSlide-1)
 		           .addClass('mk-pagination-active');

 		//if loop is enabled update pagination
 		if(this.settings.enableLoop == true && this.settings.enablePagination == true){
	 		if(this.currentSlide == this.settings.slidesCount){
	 			this.slider.find('.mk-pagination .mk-pagination-item').eq(0)
	 		           			  .addClass('mk-pagination-active');
 			}
 		}
 	}
 	//pause all playing videos
 	this.pauseStreams();
 
 }

 /*
  * Goes to next slide
  */
 mk_controller.goToNextSlide = function(){
 	var cstThis = this;
 	//check if currect slide is last one then return
 	if(this.currentSlide == this.settings.slidesCount){
 		if(this.settings.enableScrollBack == true){
 			this.goToSlide(1);
 		}
 		else if(cstThis.settings.enableLoop == true){
		 		if(cstThis.currentSlide == cstThis.settings.slidesCount){
		 			//go to first slide
		 			this.goToSlide(1,'instantly');
		 			setTimeout(function(){
		 				cstThis.goToNextSlide();
		 			},10);
		 		}
 		}
 		else{
 			return;
 		}
 	}else{
 		this.goToSlide(this.currentSlide+1);
 	}
 	//if loop is enabled update pagination
 	if(cstThis.settings.enableLoop == true && cstThis.settings.enablePagination == true){
 		if(cstThis.currentSlide == cstThis.settings.slidesCount){
 			cstThis.slider.find('.mk-pagination .mk-pagination-item').eq(0)
 		           			  .addClass('mk-pagination-active');
 		}
 	}
 }

 /*
  * Goes to previous slide
  */
 mk_controller.goToPrevSlide = function(){
 	var cstThis = this;
 	if(cstThis.settings.enableLoop == true && cstThis.currentSlide == 1){
		//go to first slide
		cstThis.goToSlide(parseInt(cstThis.settings.slidesCount),'instantly');
		setTimeout(function(){
			cstThis.goToPrevSlide();
		},10);
 	}
 	//check if currect slide is last one then return
 	else if(this.currentSlide == 1){
 		return;
 	}else{
 		this.goToSlide(this.currentSlide-1);
 	}

 	//if loop is enabled update pagination
 	if(cstThis.settings.enableLoop == true && cstThis.settings.enablePagination == true){
 		if(cstThis.currentSlide == cstThis.settings.slidesCount){
 			cstThis.slider.find('.mk-pagination .mk-pagination-item').eq(0)
 		           			  .addClass('mk-pagination-active');
 		}
 	}
 		
 }

/*
 * Binds Event handlers on pagination bullets
 */
 mk_controller.bindPaginationEvents = function(){
 	var paginationBullet = this.slider.find('.mk-pagination .mk-pagination-item');
 	var custThis = this;
 	paginationBullet.on('click',function(){
 		custThis.goToSlide( jQuery(this).index() + 1 );
 	});
 }

/*
 * Binds event handlers for navigation buttons
 */
mk_controller.bindNavigationEvents = function(){
	var leftBtn  = this.slider.find('#mk-nav-left'),
		rightBtn = this.slider.find('#mk-nav-right'),
		playBtn  = this.slider.find('#mk-nav-play'), 
		cstThis  = this;
	leftBtn.on('click',function(event){
		cstThis.goToPrevSlide();
	});
	rightBtn.on('click',function(event){
		cstThis.goToNextSlide();
	});

	//stop propogation so that navigation buttons don't trigger drag effect
	leftBtn.on('mousedown mouseup mouseleave',function(event){
		event.stopPropagation();
	});
	rightBtn.on('mousedown mouseup mouseleave',function(event){
		event.stopPropagation();
	});

}

/*
 * duplicates first image and puts in the last place
 */
 mk_controller.enableLoop = function(){
 	this.settings.slidesCount = parseInt(this.settings.slidesCount) + 1;
 	var slideWrapper = this.slider.find('.mk-slide-wrapper'),
		firstSlide    = slideWrapper.first(),
	    duplicateSlide = jQuery('<div class="mk-slide"></div>').html(slideWrapper.children()[0].innerHTML);
	slideWrapper.append(duplicateSlide);
 }



/*
 * Custom jQuery drag event
 */
mk_controller.dragEventObject = function(callback){
	var cstThis = this,
	    slider = this.slider.find('.mk-container-inner'),
	    slideWidth,
	    deltaX;

	//stopping default image drag event for
	slider.find('img').on('dragstart', function(event) { event.preventDefault(); });
	//resetting drag object
	resetDragObject();

	slider.on('mousedown touchstart',function(event){
		cstThis.dragMouseDown();
		//on mouse down fix current cordinates and time
		//and sett isDragging to true
		cstThis.dragObject.isDragging = true;
		//determining touch evetn type to give proper screen cordinates
		switch(event.type){
			case 'mousedown':{
				cstThis.dragObject.startX = event.screenX;
				cstThis.dragObject.startY = event.screenY;
				break;
			}
			case 'touchstart':{
				cstThis.dragObject.startX = event.originalEvent.touches[0].pageX;//event.screenX;
				cstThis.dragObject.startY = event.originalEvent.touches[0].pageY;//event.screenY;
				break;
			}
		}
		cstThis.dragObject.startTime = event.timeStamp;
	});
	jQuery(document).on('mousemove touchmove',function(event){
		//if isDraging is set to true and timout flag is set to false (which means
		//that mousemove can call dag event in every 10 miliseconds in our case)
		//fix end cordinates and time and call drag event callback
		if(cstThis.dragObject.isDragging == true && cstThis.dragObject.timeOutFlag == false){
			cstThis.dragObject.timeOutFlag = true;
			setTimeout(function(e){
				cstThis.dragObject.timeOutFlag = false;
				//determining touch evetn type to give proper screen cordinates
				switch(event.type){
					case 'mousemove':{
						cstThis.dragObject.endX = event.screenX;
						cstThis.dragObject.endY = event.screenY;
						break;
					}
					case 'touchmove':{
						cstThis.dragObject.endX = event.originalEvent.touches[0].pageX;//event.screenX;
						cstThis.dragObject.endY = event.originalEvent.touches[0].pageY;//event.screenY;
						break;
					}
				}
				cstThis.dragObject.endTime = event.timeStamp;
				//if isDragging then call callback
				if(cstThis.dragObject.isDragging){
					cstThis[callback+''](cstThis.dragObject);
				}
			},10);
		}
	});
	jQuery(document).on('mouseup touchend',function(event){
		//call drag mouse up callback
		cstThis.dragMouseUp();
		resetDragObject();

	});
	/*
	 * Resets drag object to its initial values
	 */
	function resetDragObject(){
		cstThis.dragObject = {
			startX: '',
			startY: '',
			endX: '',
			endY: '',
			startTime: '',
			endTime: '',
			isDragging: false,
			timeOutFlag :false
		};
	}
}

/*
 **Callback vor dragEventObject
 *
 * Drags Slider in proper direction
 */
mk_controller.dragSlider = function(dragObject){
	var movementVector = {
			x : dragObject.endX - dragObject.startX,
			y : dragObject.endY - dragObject.startY,
		},
	 	slideWrapper = this.slider.find('.mk-slide-wrapper'),
	    currentX,newX,slideWidth,
	    cstThis = this;

	//current slide width
	slideWidth = this.responsiveParams.slideWidth;
	//set transition time to small value so that dragging feels smooth
 	cstThis.setPrefixes(slideWrapper,'transition-duration','60ms');
 	//get current slide cordinates
 	currentX = this.slidePositions[this.currentSlide - 1]['coord'];
 	//new cordinate in which slider showuld be because of dragging
 	newX = currentX + movementVector['x'];
 	//check if new cordiante is out of boundaries of slidr then set max or min value
 	if(newX > 0) {
 	  newX = 0
 	};
 	if(newX < this.slidePositions[this.settings.slidesCount-1]['coord']){
 		newX = this.slidePositions[this.settings.slidesCount-1]['coord'];
 	}

 	//if drag movement is more then onw slide width return from function
 	//this prevents from dragging too long distance
 	if(Math.abs(movementVector['x']) > slideWidth){
 		//we may disable here option for dragging more then one image
 		//return;
 	}
 	//apply calculated cordinates to slider
 	slideWrapper.css('transform', 'translate3d('+newX+'px,0,0)');
}

/*
 * Callback function for custom Drag event object, when mouseup is true
 */
 mk_controller.dragMouseUp = function(){
 	var slideWrapper = this.slider.find('.mk-slide-wrapper'),
 		deltaX;
 		//when mouse is up then set original transition time
 		this.setPrefixes(slideWrapper,'transition-duration',this.settings.transitionTime + 'ms'),
		//get current sldie width
		slideWidth = this.responsiveParams.slideWidth;
		// if successful drag happened 
		// (which menas that dargObject has numeric start and end cordiantes)
		//then set deltaX 
		if(this.dragObject.startX !== '' && this.dragObject.endX !== ''){
			deltaX = this.dragObject.endX - this.dragObject.startX;
		}
		var percent = 0.03;
		//if drag is more then 'percent' of the slide then check
		//if deltaX is negative go to next slide
		//else go to previous slide
		if(Math.abs(deltaX)/slideWidth > percent){
			if(deltaX > 0){
				this.goToPrevSlide();
				//if rabbitDragging is enabled then if yser drags more them one slide width
				//slider will slide to your dragged slide instead dragging once
				if(this.settings.enableRabbitDragging == true){
					if(deltaX/slideWidth > 1){
						for(var i = 0 ; i < Math.floor(deltaX/slideWidth); i++){
							//if we are not in first or last slide then proceed
							if(this.currentSlide != 1 && this.currentSlide != this.settings.slidesCount){
								this.goToPrevSlide();
							}
						}
					}
				}
				
			}else{
				this.goToNextSlide();
				//if rabbitDragging is enabled then if yser drags more them one slide width
				//slider will slide to your dragged slide instead dragging once
				if(this.settings.enableRabbitDragging == true){
					if(deltaX/slideWidth < -1){
						for(var i = 0 ; i < Math.floor(Math.abs(deltaX/slideWidth)); i++){
							//if we are not in first or last slide then proceed
							if(this.currentSlide != 1 && this.currentSlide != this.settings.slidesCount){
								this.goToNextSlide();
							}
						}
					}
				}
			}
		}
		//else if drag is lower then 'percent' of the slide that stay on the same slide
		else if(Math.abs(deltaX)/slideWidth){
			this.goToSlide(this.currentSlide);
		}
		//remove .mk-cursor-move class from slider
		this.slider.removeClass('mk-cursor-move');

		//if autoplay was set to on that set it on
		if(this.settings.enableAutoPlay == true){
			//only set interval once 
			if(this.autoplayInterval == 'off'){
				this.startAutoPlaying();
			}
		}
 }

/*
 * Callback function for custom Drag event object, when mousedown is true
 */
 mk_controller.dragMouseDown = function (){
 	//add .mk-cursor-move class to the slider
 	this.slider.addClass('mk-cursor-move');
 	//if autoplay is on then turn it off
	clearInterval(this.autoplayInterval);
 }
/*
 * Sets prefixex css property to element -moz- -webkit- -o- -ms-
 */
mk_controller.setPrefixes = function(element,property,value){
	var webkit = '-webkti-'+property,
		moz    = '-moz-'+property,
		o      = '-o-'+property,
		ms     = '-ms-'+property;
	element.css(webkit,value);
	element.css(moz,value);
	element.css(o,value);
	element.css(ms,value);
	element.css(property,value);
}

/*
 * Autoplays The slider
 */
mk_controller.startAutoPlaying = function(){
	var cstThis = this;
	if(this.autoplayInterval === 'off'){
		this.autoplayInterval = setInterval(function(){
			switch(cstThis.settings.autoplayDirection){
				case 'right':{
					cstThis.goToNextSlide();
					break;
				}
				case 'left':{
					cstThis.goToPrevSlide();
					break;
				}
			}
		},parseInt(this.settings.autoPlayInterval));
	}
	
}

/*
 * Stops autoplaying while hovering
 */
 //mmm!/ events are not correct for touch devices
 mk_controller.stopAutoPlayOnHoverEvent = function(){
 	var innerContainer = this.slider.find('.mk-container-inner'),
 		 cstThis = this;
 	innerContainer.on('mouseenter',function(){
 		clearInterval(cstThis.autoplayInterval);
 		cstThis.autoplayInterval = 'off';
 	});
 	innerContainer.on('mouseleave',function(){
 		if(cstThis.settings.enableAutoPlay == true){
 			//check if there is no other interval then proceed
	 		if(cstThis.autoplayInterval === 'off'){
	 			//if drag event is enabled then dont autoplay while dragging
	 			if(cstThis.settings.enableDragEvent == true){
		 			if(cstThis.dragObject.isDragging == false){
		 				cstThis.startAutoPlaying();
		 			}
		 		}else{
		 			cstThis.startAutoPlaying();
		 		}
	 		}
 		}
 	});
 	
 };

/*
 * Shows navigation buttons on hover
 */
mk_controller.enableNavigationHoverEvent = function(){
	
	var navButtons = this.slider.find('.mk-navigation-buttons'),
		sliderInnerContainer = this.slider.find('.mk-container-inner');
	//hiding navigation button at first
	navButtons.addClass('mk-disabled');

	sliderInnerContainer.on('mouseenter touchstart',function(){
		navButtons.removeClass('mk-disabled');
	})

	sliderInnerContainer.on('mouseleave',function(){
		navButtons.addClass('mk-disabled');
	})

}

/*
 * Resizes all video elements in slider to proper screen resolution
 */
mk_controller.updateVideoSizes = function(){
	var innerContainer = this.slider.find('.mk-container-inner');
	innerContainer.find('video').each(function(){
		jQuery(this).width(innerContainer.width());
		jQuery(this).height(innerContainer.height());
	});
}
/*
 * Adds play buttons before each video element is slides
 */ 
mk_controller.addPlayButtons = function(){
	var cstThis = this;
	this.slider.find('.mk-slide').each(function(){
		var video = jQuery(this).find('video');
		if(video.length !== 0){
			video.before(jQuery('<span class="fa fa-play mk-play-btn"></span>'));
		}
	});
	jQuery('.mk-play-btn').on('click',function(){
		cstThis.videoController(jQuery(this));
	});
}
/*
 * handles video play/pause operations
 */
mk_controller.videoController = function(button){
	//get stream
	var stream = button.next().get(0);
	if(stream.paused){
		stream.play();
		//hide pause button after one second
		clearInterval(this.videoHoverTimeout);
		this.videoHoverTimeout = setTimeout(function(){
			button.removeClass('fa-pause');
		},1000);
	}else{
		stream.pause();
	}
	//on mousemove check stream status and display pause/play button
	button.next().on('mousemove',function(){
		if(stream.paused){
			button.removeClass('fa-pause').addClass('fa-play');
		}else{
			button.removeClass('fa-play').addClass('fa-pause');
		}
		clearInterval(this.videoHoverTimeout);
		this.videoHoverTimeout = setTimeout(function(){
			button.removeClass('fa-pause');
		},1000);
	});
	stream.onended = function(){
		button.removeClass('fa-pause').addClass('fa-play');
	}
	stream.onpause = function(){
		button.removeClass('fa-pause').addClass('fa-play');
	}
	stream.onplay = function(){
		button.removeClass('fa-play').addClass('fa-pause');
	}
}

/*
 * Pauses all playing videos in slider
 */
mk_controller.pauseStreams = function(){
	this.slider.find('video').each(function(){
		jQuery(this).get(0).pause();
	});
}