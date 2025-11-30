'use client'

import { useState } from 'react'

export default function SuccessStories() {
  const [activeStory, setActiveStory] = useState(0)

  const stories = [
    {
      name: 'Meera Devi',
      age: 55,
      location: 'Rajasthan',
      program: 'Women Empowerment',
      story: 'Through our skill development program, Meera learned tailoring and now runs her own successful business, supporting her family and employing 5 other women in her village.',
      image: '/02.jpeg',
      quote: 'This program gave me the confidence and skills to become financially independent. Now I can provide for my children\'s education.'
    },
    {
      name: 'Sunita',
      age: 9,
      location: 'Rural West Bengal',
      program: 'Childhood Education Support',
      story: 'Sunita was unable to attend school as her family couldn\'t afford basic supplies. Through our "Back to School" kit donation, she now has all the materials she needs and loves going to school, dreaming of a brighter future.',
      image: '/01.jpg',
      quote: 'I love my new bag and books! I want to be a teacher when I grow up and help other children like me.'
    },
    {
      name: 'Amit and Raju',
      age: null,
      location: 'Delhi',
      program: 'Child Labor Rehabilitation',
      story: 'Rescued from a hazardous workplace, brothers Amit and Raju are now in our care. They receive education, nutrition, and a safe environment to heal and play. They are slowly rediscovering the joys of childhood.',
      image: '/03.jpeg',
      quote: 'We get to play and learn new things every day. It\'s much better than working. We want to go to a big school.'
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