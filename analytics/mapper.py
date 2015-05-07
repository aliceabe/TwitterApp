#!/usr/bin/python

from textblob import TextBlob
import sys

#div = 43997941/30
div = 1466598

def main(argv):
	line = sys.stdin.readline()
	while line:
		line = line.strip()
		if line:
			i, kw, txt = line.split(',', 2)
			try:
				score = TextBlob(txt).sentiment.polarity
				print kw + "," + str(int(i)/div) + "\t" + str(score)
			except UnicodeDecodeError:
				pass
			line = sys.stdin.readline()
	
if __name__ == "__main__":
	main(sys.argv)