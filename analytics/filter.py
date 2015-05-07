#!/usr/bin/python

import sys
import re

keywords = ['money', 'work', 'blog', 'game of thrones', 'food', 'obama', 'paris', 'music', 'football', 'friends', 'love']

def check_keyword(text):
	for keyword in keywords:
		if keyword in text.lower():
			return keyword
	return 0

def main(argv):
	line = sys.stdin.readline()
	i = 0
	while line:
		line = line.rstrip()
		regex = re.search("^(^@.+) - (.+)$", line)
		if regex:
			text = regex.groups()[1]
			keyword = check_keyword(text)
			if keyword:
				print str(i) + ',' + keyword + ',' + text
			i += 1
		line = sys.stdin.readline()
	
if __name__ == "__main__":
	main(sys.argv)