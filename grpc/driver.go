package main

import (
	"os/exec"
	"log"
)

func main(){
	cmd := exec.Command("./listener", "")
	
	log.Printf("Running command and waiting for it to finish")

	//err := cmd.Run()
	err := cmd.Start()

	if err != nil {
		log.Fatal("Failed to start the program")
	}else{
		log.Printf("finished running with error: %v", err)
	}

	// start to send request
	
}