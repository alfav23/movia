"use client";
import { Button } from "../ui/button";

export default function Form (){
    return(
        <>
            <form className="form">
                <label htmlFor="input">Pick a color.</label>
                <input className="input border-white" type="text" />
                <Button>Suggest Movies</Button>
            </form>
        </>
    )
}