import random
number_to_guess = random.randint(1, 20)
attempts = 5
print("Guess the number (between 1 and 20)!")
while attempts > 0:
  guess = int(input("Enter your guess: "))
  if guess == number_to_guess:
    print("Congratulations! You guessed the number!")
    break
  elif guess < number_to_guess:
      print("Too low! Try again.")
  else:
      print("Too high! Try again.")
  attempts -= 1
  print(f"Attempts left: {attempts}")
  if attempts == 0:
     print(f"Sorry, you ran out of attempts! The number was {number_to_guess}.")
