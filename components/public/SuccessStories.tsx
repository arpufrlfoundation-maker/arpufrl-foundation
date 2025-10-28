'use client'

import { useState } from 'react'

export default function SuccessStories() {
  const [activeStory, setActiveStory] = useState(0)

  const stories = [
    {
      name: 'Meera Devi',
      age: 35,
      location: 'Rajasthan',
      program: 'Women Empowerment',
      story: 'Through our skill development program, Meera learned tailoring and now runs her own successful business, supporting her family and employing 5 other women in her village.',
      image: '/images/success-story-1.jpg',
      quote: 'This program gave me the confidence and skills to become financially independent. Now I can provide for my children\'s education.'
    },
    {
      name: 'Ravi Kumar',
      age: 16,
      location: 'Bihar',
      program: 'Education for All',
      story: 'Ravi was on the verge of dropping out of school to work. Our scholarship program and educational support helped him continue his studies. He recently scored 95% in his board exams.',
      image: '/images/success-story-2.jpg',
      quote: 'Education changed my life. I want to become a doctor and serve my community just like this foundation served me.'
    },
    {
      name: 'Kamala Village',
      age: null,
      location: 'Odisha',
      program: 'Clean Water Initiative',
      story: 'This remote village of 200 families now has access to clean drinking water through our well construction project. Water-borne diseases have reduced by 80%.',
      image: '/images/success-story-3.jpg',
      quote: 'Our children no longer fall sick from drinking contaminated water. The women don\'t have to walk miles to fetch water anymore.'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real stories of transformation and hope from the communities we serve
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Story Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {stories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStory(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${activeStory === index ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Active Story */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Story Image */}
              <div className="relative h-64 md:h-auto bg-gradient-to-br from-blue-100 to-blue-200">
                {stories[activeStory].image ? (
                  <img
                    src={stories[activeStory].image}
                    alt={stories[activeStory].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-blue-400 text-8xl">📖</div>
                  </div>
                )}
              </div>

              {/* Story Content */}
              <div className="p-8 md:p-12">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-4">
                    {stories[activeStory].program}
                  </span>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {stories[activeStory].name}
                  </h3>

                  <p className="text-gray-600 mb-4">
                    {stories[activeStory].age && `Age ${stories[activeStory].age}, `}
                    {stories[activeStory].location}
                  </p>
                </div>

                <blockquote className="text-lg text-gray-700 italic mb-6 border-l-4 border-blue-500 pl-4">
                  "{stories[activeStory].quote}"
                </blockquote>

                <p className="text-gray-700 leading-relaxed">
                  {stories[activeStory].story}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setActiveStory(prev => prev === 0 ? stories.length - 1 : prev - 1)}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span className="mr-2">←</span>
              Previous Story
            </button>

            <button
              onClick={() => setActiveStory(prev => prev === stories.length - 1 ? 0 : prev + 1)}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              Next Story
              <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}