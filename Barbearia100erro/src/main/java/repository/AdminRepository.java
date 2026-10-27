package repository;

public class AdminRepository {
    package com.barbearia.repository; 
    import org.springframework.data.jpa.repository.JpaRepository; 
    import com.barbearia.model.Admin; 
    import java.util.Optional; 
     
    public interface AdminRepository extends JpaRepository<Admin, Long> { 
        boolean existsByDocumento(String documento); 
        Optional<Admin> findByEmail(String email);
     }
}
