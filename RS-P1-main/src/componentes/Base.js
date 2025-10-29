import React, {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'  
import {collection, getDoc, getDocs, deleteDoc} from 'firebase/firestore'
import {db} from '../firebaseConfig/firebase'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

const Show = () => {
    const [data, setData] = useState([])

    const productsCollection = collection(db, 'products')

    const getProducts = async () => {
        const data = await getDocs(productsCollection)
        console.log(data)
    }
    
    useEffect(() => {
        getProducts()
    }, [])
  return (
    <div>Show</div>
  )
}

export default Show