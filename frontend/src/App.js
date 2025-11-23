import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import VoiceChat from './components/VoiceChat';
import SimpleVoiceChat from './components/SimpleVoiceChat';
import ReactMarkdown from 'react-markdown';

import './App.css';

const questions = [
  {
    id: 1,
    title: 'Two Sum',
    type: 'Array',
    description: 'Find two numbers that add up to a specific target',
    difficulty: 'Easy',
    details: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1]'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2]'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'The two elements at indices 0 and 1 add up to the target.'
      }
    ],
    testCases: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: [0, 1],
        explanation: 'Basic test case with two numbers that sum to target'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: [1, 2],
        explanation: 'Test case with numbers in the middle of the array'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: [0, 1],
        explanation: 'Test case with duplicate numbers'
      },
      {
        input: 'nums = [1,2,3,4,5,6,7,8,9,10], target = 19',
        output: [8, 9],
        explanation: 'Test case with larger array'
      }
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    hints: [
      'Use a hash map to store the difference between target and current number',
      'Check if the current number exists in the hash map',
      'Return the indices if found, otherwise add the current number and its index to the map'
    ],
    solution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}'
  },
  {
    id: 2,
    title: 'Add Two Numbers',
    type: 'Linked List',
    description: 'Add two numbers represented as linked lists',
    difficulty: 'Medium',
    details: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.',
    examples: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807.'
      }
    ],
    testCases: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: [7,0,8],
        explanation: '342 + 465 = 807'
      },
      {
        input: 'l1 = [0], l2 = [0]',
        output: [0],
        explanation: '0 + 0 = 0'
      },
      {
        input: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]',
        output: [8,9,9,9,0,0,0,1],
        explanation: '9999999 + 9999 = 10009998'
      }
    ],
    timeComplexity: 'O(max(m,n))',
    spaceComplexity: 'O(max(m,n))',
    hints: [
      'Initialize a dummy head for the result linked list',
      'Use a carry variable to track the carry-over from each digit addition',
      'Iterate through both lists until you reach the end of both',
      'Don\'t forget to check if there\'s any remaining carry at the end'
    ],
    solution: 'function addTwoNumbers(l1, l2) {\n  let dummy = new ListNode(0);\n  let current = dummy;\n  let carry = 0;\n  \n  while (l1 !== null || l2 !== null) {\n    const x = l1 ? l1.val : 0;\n    const y = l2 ? l2.val : 0;\n    const sum = x + y + carry;\n    \n    carry = Math.floor(sum / 10);\n    current.next = new ListNode(sum % 10);\n    current = current.next;\n    \n    if (l1) l1 = l1.next;\n    if (l2) l2 = l2.next;\n  }\n  \n  if (carry > 0) {\n    current.next = new ListNode(carry);\n  }\n  \n  return dummy.next;\n}'
  },
  // Other questions with similar structure
  {
    id: 3,
    title: 'Longest Substring Without Repeating Characters',
    type: 'String',
    description: 'Find the length of the longest substring without repeating characters',
    difficulty: 'Medium',
    details: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3.'
      }
    ],
    testCases: [
      {
        input: 's = "abcabcbb"',
        output: 3,
        explanation: 'Basic test case with multiple characters'
      },
      {
        input: 's = "bbbbb"',
        output: 1,
        explanation: 'All characters are the same'
      },
      {
        input: 's = ""',
        output: 0,
        explanation: 'Empty string case'
      }
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(m, n))',
    hints: [
      'Use a sliding window approach with two pointers',
      'Use a set to track characters in the current window',
      'When a duplicate is found, move the left pointer'
    ],
    solution: 'function lengthOfLongestSubstring(s) {\n  const set = new Set();\n  let left = 0;\n  let maxLength = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLength = Math.max(maxLength, right - left + 1);\n  }\n  return maxLength;\n}'
  },
  {
    id: 4,
    title: 'Median of Two Sorted Arrays',
    type: 'Array',
    description: 'Find the median of two sorted arrays',
    difficulty: 'Hard',
    details: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).',
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.00000',
        explanation: 'merged array = [1,2,3] and median is 2.'
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.50000',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.'
      }
    ],
    testCases: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: 2.0,
        explanation: 'Median of odd length merged array'
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: 2.5,
        explanation: 'Median of even length merged array'
      },
      {
        input: 'nums1 = [0,0], nums2 = [0,0]',
        output: 0.0,
        explanation: 'All elements are the same'
      }
    ],
    timeComplexity: 'O(log(min(m,n)))',
    spaceComplexity: 'O(1)',
    hints: [
      'Use binary search on the smaller array',
      'Partition both arrays such that the number of elements on left side is equal to right side',
      'Ensure all elements on left are less than or equal to all elements on right'
    ],
    solution: 'function findMedianSortedArrays(nums1, nums2) {\n  if (nums1.length > nums2.length) {\n    [nums1, nums2] = [nums2, nums1];\n  }\n  \n  const m = nums1.length;\n  const n = nums2.length;\n  let low = 0;\n  let high = m;\n  \n  while (low <= high) {\n    const partitionX = Math.floor((low + high) / 2);\n    const partitionY = Math.floor((m + n + 1) / 2) - partitionX;\n    \n    const maxLeftX = (partitionX === 0) ? -Infinity : nums1[partitionX - 1];\n    const minRightX = (partitionX === m) ? Infinity : nums1[partitionX];\n    \n    const maxLeftY = (partitionY === 0) ? -Infinity : nums2[partitionY - 1];\n    const minRightY = (partitionY === n) ? Infinity : nums2[partitionY];\n    \n    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {\n      if ((m + n) % 2 === 0) {\n        return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;\n      } else {\n        return Math.max(maxLeftX, maxLeftY);\n      }\n    } else if (maxLeftX > minRightY) {\n      high = partitionX - 1;\n    } else {\n      low = partitionX + 1;\n    }\n  }\n  \n  throw new Error("Input arrays are not sorted");\n}'
  },
  {
    id: 5,
    title: 'Valid Parentheses',
    type: 'Stack',
    description: 'Check if a string has valid parentheses',
    difficulty: 'Easy',
    details: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    examples: [
      {
        input: 's = "()"',
        output: 'true',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
      {
        input: 's = "(]"',
        output: 'false',
      }
    ],
    testCases: [
      {
        input: 's = "()"',
        output: true,
        explanation: 'Simple valid case'
      },
      {
        input: 's = "([)]"',
        output: false,
        explanation: 'Incorrect nesting of brackets'
      },
      {
        input: 's = "{[]}"',
        output: true,
        explanation: 'Nested valid brackets'
      }
    ],
    solution: 'function isValid(s) {\n      const stack = [];\n      const map = { ")": "(", "}": "{", "]": "[" };\n      \n      for (const char of s) {\n        if (!(char in map)) {\n          stack.push(char);\n        } else if (stack.pop() !== map[char]) {\n          return false;\n        }\n      }\n      return stack.length === 0;\n    }',
    hints: [
      'Use a stack to keep track of opening brackets',
      'When you encounter a closing bracket, check if it matches the top of the stack',
      'The string is valid if the stack is empty at the end'
    ]
  },
  {
    id: 6,
    title: 'Merge k Sorted Lists',
    type: 'Linked List',
    description: 'Merge k sorted linked lists',
    difficulty: 'Hard',
    details: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
    examples: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]',
      },
      {
        input: 'lists = []',
        output: '[]',
      },
      {
        input: 'lists = [[]]',
        output: '[]',
      }
    ],
    testCases: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: [1,1,2,3,4,4,5,6],
        explanation: 'Merge three sorted lists'
      },
      {
        input: 'lists = []',
        output: [],
        explanation: 'Empty input case'
      },
      {
        input: 'lists = [[], [1]]',
        output: [1],
        explanation: 'One empty list and one single-element list'
      }
    ],
    timeComplexity: 'O(n log k)',
    spaceComplexity: 'O(k)',
    hints: [
      'Use a min-heap to efficiently get the smallest element',
      'Add the head of each list to the heap',
      'While the heap is not empty, extract the minimum and add to result'
    ],
    solution: 'class MinHeap {\n  constructor() {\n    this.heap = [];\n  }\n  \n  insert(node) {\n    this.heap.push(node);\n    this.bubbleUp();\n  }\n  \n  extractMin() {\n    if (this.heap.length === 1) return this.heap.pop();\n    const min = this.heap[0];\n    this.heap[0] = this.heap.pop();\n    this.sinkDown(0);\n    return min;\n  }\n  \n  bubbleUp() {\n    let index = this.heap.length - 1;\n    while (index > 0) {\n      const parentIndex = Math.floor((index - 1) / 2);\n      if (this.heap[parentIndex].val <= this.heap[index].val) break;\n      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];\n      index = parentIndex;\n    }\n  }\n  \n  sinkDown(index) {\n    const left = 2 * index + 1;\n    const right = 2 * index + 2;\n    let smallest = index;\n    \n    if (left < this.heap.length && this.heap[left].val < this.heap[smallest].val) {\n      smallest = left;\n    }\n    \n    if (right < this.heap.length && this.heap[right].val < this.heap[smallest].val) {\n      smallest = right;\n    }\n    \n    if (smallest !== index) {\n      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];\n      this.sinkDown(smallest);\n    }\n  }\n  \n  isEmpty() {\n    return this.heap.length === 0;\n  }\n}\n\nfunction mergeKLists(lists) {\n  const minHeap = new MinHeap();\n  \n  // Add head of each list to min heap\n  for (const list of lists) {\n    if (list) minHeap.insert(list);\n  }\n  \n  const dummy = new ListNode();\n  let current = dummy;\n  \n  while (!minHeap.isEmpty()) {\n    const node = minHeap.extractMin();\n    current.next = node;\n    current = current.next;\n    \n    if (node.next) {\n      minHeap.insert(node.next);\n    }\n  }\n  \n  return dummy.next;\n}'
  },
  {
    id: 7,
    title: 'Container With Most Water',
    type: 'Array',
    description: 'Find two lines that together contain the most water',
    difficulty: 'Medium',
    details: 'Given n non-negative integers a1, a2, ..., an, where each represents a point at coordinate (i, ai). n vertical lines are drawn such that the two endpoints of the line i is at (i, ai) and (i, 0). Find two lines, which, together with the x-axis forms a container, such that the container contains the most water.\n\nNotice that you may not slant the container.',
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.'
      },
      {
        input: 'height = [1,1]',
        output: '1',
      },
      {
        input: 'height = [4,3,2,1,4]',
        output: '16',
      }
    ],
    testCases: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: 49,
        explanation: 'Maximum area between lines at indices 1 and 8'
      },
      {
        input: 'height = [1,1]',
        output: 1,
        explanation: 'Minimum possible area with two lines'
      },
      {
        input: 'height = [4,3,2,1,4]',
        output: 16,
        explanation: 'Maximum area between first and last elements'
      }
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    hints: [
      'Use two pointers starting from both ends',
      'Calculate area between the two pointers',
      'Move the pointer pointing to the shorter line',
      'Keep track of the maximum area found'
    ],
    solution: 'function maxArea(height) {\n  let maxArea = 0;\n  let left = 0;\n  let right = height.length - 1;\n  \n  while (left < right) {\n    const h = Math.min(height[left], height[right]);\n    const w = right - left;\n    maxArea = Math.max(maxArea, h * w);\n    \n    if (height[left] < height[right]) {\n      left++;\n    } else {\n      right--;\n    }\n  }\n  \n  return maxArea;\n}'
  },
  {
    id: 8,
    title: 'Longest Palindromic Substring',
    type: 'String',
    description: 'Find the longest palindromic substring in a string',
    difficulty: 'Medium',
    details: 'Given a string s, return the longest palindromic substring in s.\n\nA string is called a palindrome string if the reverse of that string is the same as the original string.',
    examples: [
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: '"aba" is also a valid answer.'
      },
      {
        input: 's = "cbbd"',
        output: '"bb"',
      },
      {
        input: 's = "a"',
        output: '"a"',
      }
    ],
    testCases: [
      {
        input: 's = "babad"',
        output: 'bab',
        explanation: 'Longest palindromic substring is "bab" or "aba"'
      },
      {
        input: 's = "cbbd"',
        output: 'bb',
        explanation: 'Longest palindromic substring is "bb"'
      },
      {
        input: 's = "a"',
        output: 'a',
        explanation: 'Single character string'
      }
    ],
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    hints: [
      'Consider each character as the center of a palindrome',
      'Expand around the center for both odd and even length palindromes',
      'Keep track of the longest palindrome found'
    ],
    solution: 'function longestPalindrome(s) {\n  if (!s || s.length < 1) return "";\n  \n  let start = 0;\n  let end = 0;\n  \n  for (let i = 0; i < s.length; i++) {\n    const len1 = expandAroundCenter(s, i, i);\n    const len2 = expandAroundCenter(s, i, i + 1);\n    const len = Math.max(len1, len2);\n    \n    if (len > end - start) {\n      start = i - Math.floor((len - 1) / 2);\n      end = i + Math.floor(len / 2);\n    }\n  }\n  \n  return s.substring(start, end + 1);\n}\n\nfunction expandAroundCenter(s, left, right) {\n  while (left >= 0 && right < s.length && s[left] === s[right]) {\n    left--;\n    right++;\n  }\n  return right - left - 1;\n}'
  },
  {
    id: 9,
    title: '3Sum',
    type: 'Array',
    description: 'Find all unique triplets that sum to zero',
    difficulty: 'Medium',
    details: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.',
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
      },
      {
        input: 'nums = [0,1,1]',
        output: '[]',
        explanation: 'The only possible triplet does not sum up to 0.'
      },
      {
        input: 'nums = [0,0,0]',
        output: '[[0,0,0]]',
        explanation: 'The only possible triplet sums up to 0.'
      }
    ],
    testCases: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: [[-1,-1,2],[-1,0,1]],
        explanation: 'Two unique triplets that sum to zero'
      },
      {
        input: 'nums = [0,0,0,0]',
        output: [[0,0,0]],
        explanation: 'Single triplet with all zeros'
      },
      {
        input: 'nums = [1,2,-2,-1]',
        output: [],
        explanation: 'No triplets sum to zero'
      }
    ],
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    hints: [
      'Sort the array first',
      'Use three pointers: one for the current element and two for the remaining elements',
      'Skip duplicate elements to avoid duplicate triplets',
      'Use the two-pointer technique to find pairs that sum to the negative of the current element'
    ],
    solution: 'function threeSum(nums) {\n  const result = [];\n  nums.sort((a, b) => a - b);\n  \n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    \n    let left = i + 1;\n    let right = nums.length - 1;\n    \n    while (left < right) {\n      const sum = nums[i] + nums[left] + nums[right];\n      \n      if (sum === 0) {\n        result.push([nums[i], nums[left], nums[right]]);\n        \n        // Skip duplicates\n        while (left < right && nums[left] === nums[left + 1]) left++;\n        while (left < right && nums[right] === nums[right - 1]) right--;\n        \n        left++;\n        right--;\n      } else if (sum < 0) {\n        left++;\n      } else {\n        right--;\n      }\n    }\n  }\n  \n  return result;\n}'
  },
  {
    id: 10,
    title: 'Merge Intervals',
    type: 'Array',
    description: 'Merge overlapping intervals',
    difficulty: 'Medium',
    details: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].'
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.'
      }
    ],
    testCases: [
      {
        input: '[[1,3],[2,6],[8,10],[15,18]]',
        output: [[1,6],[8,10],[15,18]],
        explanation: 'Merge overlapping intervals'
      },
      {
        input: '[[1,4],[4,5]]',
        output: [[1,5]],
        explanation: 'Adjacent intervals should be merged'
      },
      {
        input: '[[1,4],[0,4]]',
        output: [[0,4]],
        explanation: 'Fully overlapping intervals'
      }
    ],
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    hints: [
      'Sort the intervals based on the start time',
      'Initialize the result with the first interval',
      'Iterate through the sorted intervals and merge if they overlap',
      'If they don\'t overlap, add the current interval to the result'
    ],
    solution: 'function merge(intervals) {\n  if (intervals.length <= 1) return intervals;\n  \n  // Sort intervals by start time\n  intervals.sort((a, b) => a[0] - b[0]);\n  \n  const result = [intervals[0]];\n  \n  for (let i = 1; i < intervals.length; i++) {\n    const current = intervals[i];\n    const last = result[result.length - 1];\n    \n    // If the current interval overlaps with the last merged interval\n    if (current[0] <= last[1]) {\n      // Merge them by updating the end time\n      last[1] = Math.max(last[1], current[1]);\n    } else {\n      // Add the current interval to the result\n      result.push(current);\n    }\n  }\n  \n  return result;\n}'
  },
  {
    id: 11,
    title: 'Group Anagrams',
    type: 'Hash Table',
    description: 'Group anagrams together from a list of strings',
    difficulty: 'Medium',
    details: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
      {
        input: 'strs = [""]',
        output: '[[""]]',
      },
      {
        input: 'strs = ["a"]',
        output: '[["a"]]',
      }
    ],
    testCases: [
      {
        input: '["eat","tea","tan","ate","nat","bat"]',
        output: [["bat"],["nat","tan"],["ate","eat","tea"]],
        explanation: 'Group anagrams together'
      },
      {
        input: '[""]',
        output: [[""]],
        explanation: 'Single empty string'
      },
      {
        input: '["a"]',
        output: [["a"]],
        explanation: 'Single character string'
      }
    ],
    timeComplexity: 'O(n * k log k)',
    spaceComplexity: 'O(n * k)',
    hints: [
      'Use a hash map to group anagrams',
      'Use the sorted version of each string as the key in the map',
      'Strings that are anagrams will have the same sorted string'
    ],
    solution: 'function groupAnagrams(strs) {\n  const map = new Map();\n  \n  for (const str of strs) {\n    // Sort the string to use as a key\n    const sorted = str.split(\'\').sort().join(\'\');\n    \n    // If the key doesn\'t exist, initialize with empty array\n    if (!map.has(sorted)) {\n      map.set(sorted, []);\n    }\n    \n    // Add the original string to the array\n    map.get(sorted).push(str);\n  }\n  \n  // Convert the map values to an array\n  return Array.from(map.values());\n}'
  },
  {
    id: 12,
    title: 'Maximum Subarray',
    type: 'Array',
    description: 'Find the contiguous subarray with the largest sum',
    difficulty: 'Easy',
    details: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nA subarray is a contiguous part of an array.',
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: '[4,-1,2,1] has the largest sum = 6.'
      },
      {
        input: 'nums = [1]',
        output: '1',
      },
      {
        input: 'nums = [5,4,-1,7,8]',
        output: '23',
      }
    ],
    testCases: [
      {
        input: '[-2,1,-3,4,-1,2,1,-5,4]',
        output: 6,
        explanation: 'Maximum subarray sum is 6 [4,-1,2,1]'
      },
      {
        input: '[1]',
        output: 1,
        explanation: 'Single element array'
      },
      {
        input: '[5,4,-1,7,8]',
        output: 23,
        explanation: 'Entire array is the maximum subarray'
      }
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    hints: [
      'Use Kadane\'s algorithm',
      'Keep track of the maximum sum ending at each position',
      'If the current element is greater than the sum ending at the previous position plus the current element, start a new subarray',
      'Update the maximum sum found so far'
    ],
    solution: 'function maxSubArray(nums) {\n  if (nums.length === 0) return 0;\n  \n  let maxCurrent = nums[0];\n  let maxGlobal = nums[0];\n  \n  for (let i = 1; i < nums.length; i++) {\n    // Choose between extending the previous subarray or starting a new one\n    maxCurrent = Math.max(nums[i], maxCurrent + nums[i]);\n    \n    // Update the global maximum\n    if (maxCurrent > maxGlobal) {\n      maxGlobal = maxCurrent;\n    }\n  }\n  \n  return maxGlobal;\n}'
  },
  {
    id: 13,
    title: 'Word Search',
    type: 'Backtracking',
    description: 'Search for a word in a 2D grid of characters',
    difficulty: 'Medium',
    details: 'Given an m x n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.',
    examples: [
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: 'true',
      },
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"',
        output: 'true',
      },
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"',
        output: 'false',
      }
    ],
    testCases: [
      {
        input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"',
        output: true,
        explanation: 'Word can be formed by adjacent cells'
      },
      {
        input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCB"',
        output: false,
        explanation: 'Word cannot be formed without reusing cells'
      },
      {
        input: '[["a"]], "a"',
        output: true,
        explanation: 'Single character board and word'
      }
    ],
    timeComplexity: 'O(m * n * 4^l)',
    spaceComplexity: 'O(l)',
    hints: [
      'Use backtracking/DFS to explore all possible paths',
      'Mark visited cells to avoid reuse',
      'Check all four possible directions (up, down, left, right)',
      'Return early if the current path cannot form the word'
    ],
    solution: 'function exist(board, word) {\n  const m = board.length;\n  const n = board[0].length;\n  \n  function dfs(i, j, index) {\n    // If we\'ve matched all characters\n    if (index === word.length) return true;\n    \n    // Check boundaries and character match\n    if (i < 0 || i >= m || j < 0 || j >= n || board[i][j] !== word[index]) {\n      return false;\n    }\n    \n    // Mark the current cell as visited\n    const temp = board[i][j];\n    board[i][j] = \'#\';\n    \n    // Explore all four directions\n    const found = dfs(i + 1, j, index + 1) ||\\n                 dfs(i - 1, j, index + 1) ||\\n                 dfs(i, j + 1, index + 1) ||\\n                 dfs(i, j - 1, index + 1);\n    \n    // Backtrack: restore the original character\n    board[i][j] = temp;\n    \n    return found;\n  }\n  \n  // Try starting from each cell in the board\n  for (let i = 0; i < m; i++) {\n    for (let j = 0; j < n; j++) {\n      if (board[i][j] === word[0] && dfs(i, j, 0)) {\n        return true;\n      }\n    }\n  }\n  \n  return false;\n}'
  },
  {
    id: 14,
    title: 'Best Time to Buy and Sell Stock',
    type: 'Array',
    description: 'Find the maximum profit from buying and selling a stock',
    difficulty: 'Easy',
    details: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.'
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.'
      }
    ],
    testCases: [
      {
        input: '[7,1,5,3,6,4]',
        output: 5,
        explanation: 'Buy at 1, sell at 6 for max profit of 5'
      },
      {
        input: '[7,6,4,3,1]',
        output: 0,
        explanation: 'No transactions, profit is 0'
      },
      {
        input: '[2,4,1]',
        output: 2,
        explanation: 'Buy at 2, sell at 4 for profit of 2'
      }
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    hints: [
      'Keep track of the minimum price seen so far',
      'Calculate potential profit at each step',
      'Update the maximum profit found so far',
      'Return 0 if no profit can be made'
    ],
    solution: 'function maxProfit(prices) {\n  if (prices.length <= 1) return 0;\n  \n  let minPrice = prices[0];\n  let maxProfit = 0;\n  \n  for (let i = 1; i < prices.length; i++) {\n    // Update the minimum price seen so far\n    if (prices[i] < minPrice) {\n      minPrice = prices[i];\n    }\n    // Calculate potential profit and update maxProfit\n    else if (prices[i] - minPrice > maxProfit) {\n      maxProfit = prices[i] - minPrice;\n    }\n  }\n  \n  return maxProfit;\n}'
  },
  {
    id: 15,
    title: 'LRU Cache',
    type: 'Design',
    description: 'Design a Least Recently Used (LRU) cache',
    difficulty: 'Hard',
    details: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.\n\nThe functions get and put must each run in O(1) average time complexity.',
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: 'LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache is {1=1}\nlRUCache.put(2, 2); // cache is {1=1, 2=2}\nlRUCache.get(1);    // return 1\nlRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}\nlRUCache.get(2);    // returns -1 (not found)\nlRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}\nlRUCache.get(1);    // return -1 (not found)\nlRUCache.get(3);    // return 3\nlRUCache.get(4);    // return 4'
      }
    ],
    testCases: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: [null, null, null, 1, null, -1, null, -1, 3, 4],
        explanation: 'Test case with capacity 2 and multiple operations'
      },
      {
        input: '["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]',
        output: [null, null, 1, null, -1, 2],
        explanation: 'Test case with capacity 1 and edge cases'
      }
    ],
    timeComplexity: 'O(1) for both get and put operations',
    spaceComplexity: 'O(capacity)',
    hints: [
      'Use a hash map to store key-value pairs for O(1) access',
      'Use a doubly linked list to maintain the order of usage',
      'When a key is accessed, move it to the front of the list',
      'When capacity is reached, remove the least recently used item from the end'
    ],
    solution: 'class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n    this.head = new Node(0, 0);\n    this.tail = new Node(0, 0);\n    this.head.next = this.tail;\n    this.tail.prev = this.head;\n  }\n\n  get(key) {\n    if (this.cache.has(key)) {\n      const node = this.cache.get(key);\n      this.remove(node);\n      this.add(node);\n      return node.value;\n    }\n    return -1;\n  }\n\n  put(key, value) {\n    if (this.cache.has(key)) {\n      this.remove(this.cache.get(key));\n    }\n    const newNode = new Node(key, value);\n    this.add(newNode);\n    this.cache.set(key, newNode);\n    if (this.cache.size > this.capacity) {\n      const lru = this.head.next;\n      this.remove(lru);\n      this.cache.delete(lru.key);\n    }\n  }\n\n  add(node) {\n    const prev = this.tail.prev;\n    prev.next = node;\n    node.prev = prev;\n    node.next = this.tail;\n    this.tail.prev = node;\n  }\n\n  remove(node) {\n    const { prev, next } = node;\n    prev.next = next;\n    next.prev = prev;\n  }\n}\n\nclass Node {\n  constructor(key, value) {\n    this.key = key;\n    this.value = value;\n    this.prev = null;\n    this.next = null;\n  }\n}'
  }
];

function stopAllAudio() {
  try {
    // Stop all playing HTML audio elements
    const audios = document.querySelectorAll("audio");
    audios.forEach(a => {
      a.pause();
      a.currentTime = 0;
    });

    // Stop Web Speech / TTS if you're using it
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    console.log("stopAllAudio error:", e);
  }
}

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentView !== "interview") {
      stopAllAudio();
    }
  }, [currentView]);

  const handleLogin = () => {
    setCurrentView('questionSelector');
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setCurrentView('interview');
  };

  const handleInterviewFinish = (data) => {
    setAnalysisData(data);
    setCurrentView('interviewReview');
  };

  const handleBack = () => {
      setCurrentView('questionSelector');
  };

  return (
    <div className="App">
      {currentView === 'login' && <Login onLogin={handleLogin} />}
      {currentView === 'questionSelector' && (
        <QuestionSelector onQuestionSelect={handleQuestionSelect} />
      )}
      {currentView === 'interview' && (
        <Interview 
          question={selectedQuestion} 
          onInterviewFinish={handleInterviewFinish}
          onBack={handleBack}
        />
      )}
      {currentView === 'interviewReview' && <InterviewReview analysis={analysisData} onBack={handleBack}/>}
    </div>
  );
}

function ConfirmLeaveModal({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <h2 className="confirm-title">Leave Interview?</h2>
        <p className="confirm-text">
          Are you sure you want to leave? Your progress will not be saved.
        </p>

        <div className="confirm-buttons">
          <button className="confirm-btn leave" onClick={onConfirm}>
            Leave
          </button>
          <button className="confirm-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in to start your interview session</p>
        <input type="email" placeholder="Email" className="input-field" />
        <input type="password" placeholder="Password" className="input-field" />
        <button onClick={onLogin} className="primary-button">Log In</button>
        <p className="signup-text">
          Don't have an account? <a href="#" className="link">Sign up</a>
        </p>
      </div>
    </div>
  );
}

function QuestionSelector({ onQuestionSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Get all unique question types for the filter dropdown
  const questionTypes = [...new Set(questions.map(q => q.type))];
  
  // Filter questions based on search term and category
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                          question.type.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };
  
  const getDifficultyColor = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="question-selector-container">
      <div className="question-header">
        <h2 className="page-title">Interview Questions</h2>
        <div className="question-filters">
          <input 
            type="text" 
            placeholder="Search questions..." 
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={handleCategoryChange}
          >
            <option value="all">All Categories</option>
            {questionTypes.map(type => (
              <option key={type} value={type.toLowerCase()}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="questions-table">
        <div className="table-header">
          <div className="table-row">
            <div className="table-cell">Title</div>
            <div className="table-cell">Type</div>
            <div className="table-cell">Description</div>
            <div className="table-cell">Difficulty</div>
          </div>
        </div>
        <div className="table-body">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q) => (
            <div 
              key={q.id} 
              className="table-row clickable"
              onClick={() => onQuestionSelect(q)}
            >
              <div className="table-cell title-cell">
                <span className="question-number">{q.id}.</span> {q.title}
              </div>
              <div className="table-cell">
                <span className="type-tag">{q.type}</span>
              </div>
              <div className="table-cell description-cell">
                {q.description}
              </div>
              <div className="table-cell">
                <span 
                  className="difficulty-tag"
                  data-difficulty={q.difficulty}
                >
                  {q.difficulty}
                </span>
              </div>
            </div>
            ))
          ) : (
            <div className="no-results">
              No questions found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ onBack }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button
          className="back-button"
          onClick={onBack}          // ✅ just call the prop
          title="Exit Interview"
        >          
        <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="back-icon"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* CENTER — Logo */}
        <div className="app-logo">
          <div className="logo-mark">🍲</div>
          <span className="logo-text">P.O.T.S.</span>
        </div>

        {/* RIGHT — Spacer */}
        <div className="header-spacer"></div>
      </div>
    </header>
  );
}

function LanguageSelector({ selectedLanguage, onLanguageSelect }) {
  return (
    <div className="language-selector">
      <button
        className={selectedLanguage === 'cpp' ? 'selected' : ''}
        onClick={() => onLanguageSelect('cpp')}
      >
        C++
      </button>
      <button
        className={selectedLanguage === 'python' ? 'selected' : ''}
        onClick={() => onLanguageSelect('python')}
      >
        Python
      </button>
      <button
        className={selectedLanguage === 'java' ? 'selected' : ''}
        onClick={() => onLanguageSelect('java')}
      >
        Java
      </button>
      <button
        className={selectedLanguage === 'javascript' ? 'selected' : ''}
        onClick={() => onLanguageSelect('javascript')}
      >
        JavaScript
      </button>
    </div>
  );
}

function ProblemDescription({ question }) {
  return (
    <div className="problem-description">
      <h2>{question.title}</h2>
      <p>{question.description}</p>
      <p>{question.details}</p>
      {question.examples.map((ex, index) => (
        <div className="example" key={index}>
          <p><strong>Example {index + 1}:</strong></p>
          <pre>
            <strong>Input:</strong> {ex.input}<br />
            <strong>Output:</strong> {ex.output}
            {ex.explanation && <><br /><strong>Explanation:</strong> {ex.explanation}</>}
          </pre>
        </div>
      ))}
    </div>
  );
}

function InterviewReview({ analysis, onBack }) {
  // Check if analysis is in the new format (object with analysis data)
  const isNewFormat = analysis && typeof analysis === 'object' && 'overall_score' in analysis;
  
  // For backward compatibility with old string format
  if (!isNewFormat) {
    const cleanAnalysis = analysis ? 
      analysis.replace(/^```markdown\n|```$/g, '') : 
      'No analysis available';
      
    return (
      <div className="interview-review-container">
      <Header onBack={onBack}/>
        <div className="interview-review-content">
          <h2>Interview Review</h2>
          <div className="analysis-section">
            <h3>Code Analysis</h3>
            <div className="markdown-content">
              <ReactMarkdown>{cleanAnalysis}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New format with structured data
  const { 
    overall_score, 
    detailed_scores = {},
    strengths = [],
    areas_for_improvement = [],
    detailed_summary = ''
  } = analysis;
  
  // Function to render a score bar
  const renderScoreBar = (score, label) => (
    <div key={label} className="score-item">
      <div className="score-label">{label}</div>
      <div className="score-bar-container">
        <div 
          className="score-bar" 
          style={{ width: `${(score / 10) * 100}%` }}
          aria-valuenow={score}
          aria-valuemin="0"
          aria-valuemax="10"
        >
          {score.toFixed(1)}/10
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="interview-review-container">
      <Header onBack={onBack}/>
      <div className="interview-review-content">
        <h2>Interview Review</h2>
        
        <div className="overall-score">
          <h3>Overall Score: <span className="score">{overall_score.toFixed(1)}/10</span></h3>
        </div>
        
        <div className="scores-section">
          <h3>Detailed Scores</h3>
          {Object.entries(detailed_scores).map(([key, score]) => (
            renderScoreBar(score, key.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '))
          ))}
        </div>
        
        <div className="analysis-section">
          <h3>Strengths</h3>
          <ul className="strengths-list">
            {strengths.map((strength, index) => (
              <li key={index} className="strength-item">
                <span className="strength-icon">✓</span>
                {strength}
              </li>
            ))}
          </ul>
          
          {areas_for_improvement.length > 0 && (
            <>
              <h3>Areas for Improvement</h3>
              <ul className="improvements-list">
                {areas_for_improvement.map((item, index) => (
                  <li key={index} className="improvement-item">
                    <span className="improvement-icon">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {detailed_summary && (
            <div className="detailed-summary">
              <h3>Detailed Feedback</h3>
              <div className="markdown-content">
                <ReactMarkdown>{detailed_summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function Interview({ question, onInterviewFinish, onBack }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [fontSize, setFontSize] = useState(20); // Default font size
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameId = useRef(null);

  const ttsAudioRef = useRef(null);        // for speak()
  const responseAudioRef = useRef(null);   // for sendToElevenLabs()
  
  // Handle interview start when user is ready
  const handleReady = () => {
    setInterviewStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === '=') {
          event.preventDefault();
          setFontSize(size => size + 1);
        } else if (event.key === '-') {
          event.preventDefault();
          setFontSize(size => Math.max(8, size - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--code-font-size', `${fontSize}px`);
    }
  }, [fontSize]);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    };

    getCamera();
  }, []);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };
  
  // Initialize audio context and analyser
  const initAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64; // Smaller FFT size for smoother visualization
      
      // Start the visualization loop
      const visualize = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        if (isPlaying || isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Only update state if there's actual audio data
          if (dataArray.some(level => level > 0)) {
            setAudioData([...dataArray]); // Create a new array to trigger re-render
          }
          animationFrameId.current = requestAnimationFrame(visualize);
        }
      };
      
      // Start the visualization loop
      animationFrameId.current = requestAnimationFrame(visualize);
    } catch (err) {
      console.error('Error initializing audio context:', err);
    }
  };
  
  // Set up audio context on mount and clean up on unmount
  useEffect(() => {
    initAudioContext();
    
    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isPlaying, isRecording]); // Re-run when recording/playback state changes
  
  // Function to save editor content to test.txt
  const saveEditorContent = async () => {
    try {
      console.log('Saving code to test.txt...');
      console.log('Code content:', code);
      
      const response = await fetch('http://localhost:5008/save-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: code || '// No code to save',
          language: selectedLanguage 
        }),
      });
      
      const responseData = await response.json();
      console.log('Save response:', responseData);
      
      if (!response.ok) {
        throw new Error(`Failed to save code: ${responseData.error || response.statusText}`);
      }
      
      console.log('Code saved to test.txt successfully');
      return true;
    } catch (error) {
      console.error('Error saving code:', error);
      return false;
    }
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      // Save current editor content to test.txt
      await saveEditorContent();
      
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Set up media recorder with specific MIME type
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      // Check if the MIME type is supported
      let mediaRecorder;
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log(`Using MIME type: ${options.mimeType}`);
      } else {
        console.warn(`MIME type ${options.mimeType} not supported, using default`);
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up audio processing
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Create a new analyser for the recording stream
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);
      
      // Start the visualization
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      const visualize = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Update the visualizer with new data
        setAudioData([...dataArray]);
        
        // Continue the animation loop
        animationFrameId.current = requestAnimationFrame(visualize);
      };
      
      // Start the visualization loop
      animationFrameId.current = requestAnimationFrame(visualize);
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Collected audio chunk: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Request data every 100ms
      console.log('Recording started with MIME type:', mediaRecorder.mimeType);
      setIsRecording(true);
      setIsPlaying(false);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };
  
  // Function to send audio to backend for processing
  const sendToElevenLabs = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Show loading state
      setIsProcessing(true);
      
      // Get the current question title or use a default
      const questionTitle = question?.title || 'the coding problem';
      
      // Send to backend with question title
      const response = await fetch(`http://localhost:5008/process_audio?question_title=${encodeURIComponent(questionTitle)}`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the correct boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process audio');
      }
      
      // Get the audio response as a blob
      const audioData = await response.blob();
      
      if (audioData.size === 0) {
        throw new Error('Received empty audio response');
      }
      
      // Create a URL for the audio blob
      const audioUrl = URL.createObjectURL(audioData);
      const audio = new Audio(audioUrl);
      
      // Set up event handlers
      audio.onended = () => {
        console.log('Playback finished');
        setIsPlaying(false);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
      };
      
      console.log('Starting playback...');
      setIsPlaying(true);
      await audio.play().catch(e => {
        console.error('Error playing audio:', e);
        setIsPlaying(false);
        throw e;
      });
      
    } catch (err) {
      console.error('Error processing audio:', err);
      alert(`Error: ${err.message || 'Failed to process audio'}`);
      throw err; // Re-throw to be caught by the caller
    } finally {
      setIsProcessing(false);
      setIsRecording(false);
    }
  };
  
  // Stop recording and process audio
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    
    // Process the recorded audio
    mediaRecorderRef.current.onstop = async () => {
      try {
        // Use the actual MIME type that the MediaRecorder was using
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log(`Sending audio to backend (${audioBlob.size} bytes, type: ${mimeType})`);
        
        // Send audio to backend for processing
        await sendToElevenLabs(audioBlob);
        
      } catch (err) {
        console.error('Error in recording processing:', err);
        // Error is already handled in sendToElevenLabs
      }
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // First save the code
      const saveResponse = await fetch('http://127.0.0.1:5008/save-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save code');
      }

      console.log('Code saved successfully, submitting interview for analysis...');
      
      // Then submit the interview for comprehensive analysis
      const submitResponse = await fetch('http://127.0.0.1:5008/submit-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          question: {
            title: question.title,
            description: question.description || ''
          }
        }),
      });
      
      if (submitResponse.ok) {
        const result = await submitResponse.json();
        if (result.status === 'success' && result.analysis) {
          // Pass the complete analysis object to the InterviewReview component
          onInterviewFinish(result.analysis);
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        const error = await submitResponse.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to analyze interview');
      }
    } catch (error) {
      console.error('Error during submit process:', error);
      onInterviewFinish('An error occurred during the submission process.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get voices with detailed logging
  const getVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('=== Available Voices ===');
    voices.forEach((voice, index) => {
      console.log(`[${index}] ${voice.name} (${voice.lang}) - Default: ${voice.default ? 'Yes' : 'No'}`);
      console.log('   Voice URI:', voice.voiceURI);
      console.log('   Local Service:', voice.localService);
      console.log('   Default:', voice.default);
    });
    return voices;
  };

  // Function to speak using ElevenLabs through our backend
  const speak = async (text) => {
    if (!text || !text.trim()) {
      console.warn('Empty text provided to speak');
      return;
    }
    
    // Clean up the text to remove any problematic characters
    const cleanText = text
      .replace(/[\r\n]+/g, ' ')  // Replace newlines with spaces
      .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
      .trim();
    
    console.log('Sending text to ElevenLabs TTS (first 100 chars):', cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : ''));
    
    try {
      const response = await fetch('http://localhost:5008/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`TTS request failed: ${error}`);
      }
      
      // Get the audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create a new audio context for better control
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
      
      return new Promise((resolve) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          console.log('Finished playing TTS audio');
          source.disconnect();
          URL.revokeObjectURL(audioUrl); // Clean up
          audioContext.close();
          resolve();
        };
        
        source.onerror = (error) => {
          console.error('Error playing TTS audio:', error);
          source.disconnect();
          URL.revokeObjectURL(audioUrl);
          audioContext.close();
          resolve();
        };
        
        try {
          source.start(0);
          console.log('Started playing TTS audio');
        } catch (error) {
          console.error('Error starting TTS playback:', error);
          source.disconnect();
          URL.revokeObjectURL(audioUrl);
          audioContext.close();
          resolve();
        }
      });
    } catch (error) {
      console.error('Error in TTS:', error);
      // Fall back to Web Speech API if ElevenLabs fails
      console.warn('Falling back to Web Speech API');
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = resolve;
        utterance.onerror = resolve; // Always resolve to prevent hanging
        window.speechSynthesis.speak(utterance);
      });
    }
  };

  // Handle when user provides their name
  const handleNameResponse = async (name) => {
    try {
      // First, explain the problem in detail in a natural flow
      const problemExplanation = question.description
        .replace(/`/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Create a more natural flow in a single speech call
      const introText = [
        `Great to meet you, ${name}.`,
        `Let's work on today's problem: ${question.title}.`,
        problemExplanation,
        "I'm curious, how would you approach solving this problem?"
      ].join(' ');
      
      await speak(introText);
      
    } catch (error) {
      console.error('Error in name response:', error);
    }
  };

  // Play intro audio when component mounts
  useEffect(() => {
    const speakIntro = async () => {
      try {
        // Single, natural-sounding introduction
        await speak("Hi there! I'm Potts, a senior software engineer at Scotiabank. I'll be conducting your technical interview today. Could you please tell me your name?");
      } catch (error) {
        console.error('Error in introduction:', error);
      }
    };

    // Small delay to ensure voices are loaded
    const timer = setTimeout(() => {
      speakIntro();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const [userName, setUserName] = useState('');
  const [isAskingName, setIsAskingName] = useState(true);

  // Handle voice transcript
  const handleTranscript = async (text) => {
    console.log('User said:', text);
    
    if (isAskingName && text.trim()) {
      // User provided their name
      const name = text.trim();
      setUserName(name);
      setIsAskingName(false);
      
      // Handle the name response and continue with problem explanation
      handleNameResponse(name);
    }
  };

return (
  <div className="interview-wrapper" ref={wrapperRef}>
      <Header onBack={onBack}/>
      <div className="interview-container">
        <div className="main-content">
          <div className="editor-container">
            <div className="code-editor-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div>
                <SimpleVoiceChat onTranscript={handleTranscript} />
              </div>
            </div>
            <Editor
              height="100%"
              language={selectedLanguage}
              theme="vs-dark"
              value={code}
              onChange={setCode}
              options={{
                fontSize: fontSize,
                bracketPairColorization: { enabled: true },
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10
                }
              }}
            />
          </div>
          
          {/* Visualizer and record button at the bottom of the editor */}
          <div className="visualizer-container">
            <div style={{ 
              flex: 1, 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              marginRight: '20px'
            }}>
              <SimpleVoiceChat isPlaying={isPlaying} />
            </div>
            
            {/* Record button */}
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isPlaying}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isRecording ? 'rgba(255, 69, 58, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                color: isRecording ? '#ff453a' : 'rgba(0, 122, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isProcessing || isPlaying) ? 'not-allowed' : 'pointer',
                opacity: (isProcessing || isPlaying) ? 0.6 : 1,
                transition: 'all 0.3s ease',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                outline: 'none',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isProcessing ? (
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'currentColor',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : isRecording ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  backgroundColor: 'currentColor'
                }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Submit button in bottom right of code editor */}
          <div style={{
            position: 'absolute',
            bottom: '90px',
            right: '24px',
            zIndex: 10
          }}>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                color: 'rgba(40, 167, 69, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              title="Submit code"
            >
              {isSubmitting ? (
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'currentColor',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : '✓'}
            </button>
          </div>
        </div>
        <div className="sidebar">
          <video ref={videoRef} className="camera-view" autoPlay playsInline></video>
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />
          <ProblemDescription question={question} />
        </div>
      </div>
    </div>
  );
}

// Wrap the App with Router
function AppWrapper() {
  return (
    <Router>
      <Routes>
        <Route path="/voice-chat" element={<VoiceChat />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  );
}

export default AppWrapper;
